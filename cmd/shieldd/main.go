//go:build linux
package main

import (
	"context"
	"encoding/json"
	"expvar"
	"fmt"
	"io"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/Dragon-Tools/dragon-shield-backend/internal/ai"
	"github.com/Dragon-Tools/dragon-shield-backend/internal/hotpatch"
	"github.com/Dragon-Tools/dragon-shield-backend/internal/telemetry"
	"github.com/Dragon-Tools/dragon-shield-backend/internal/verifier"
	"github.com/Dragon-Tools/dragon-shield-backend/rules"
)

const (
	// metricsAddr is the address for the Prometheus metrics server.
	metricsAddr = ":9090"
	// apiAddr is the address for the main API server.
	apiAddr     = ":8080"
)

// main is the entry point of the application. It initializes the various components
// of the Dragon Shield backend, including the rule loader, telemetry pipeline,
// AI rule-forge, and API servers. It also handles graceful shutdown.
func main() {
	// Create a context that is canceled on SIGINT or SIGTERM.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// 1. Boot baseline rules from the embedded filesystem.
	rules, err := loadRules()
	if err != nil {
		log.Fatalf("baseline rules: %v", err)
	}

	// 2. Start the telemetry pipeline, which streams eBPF events to a ring buffer.
	tel := telemetry.New(rules)
	go tel.Stream(ctx)

	// 3. Start the AI rule-forge loop, which synthesizes new rules based on telemetry events.
	forge := ai.New(tel.Events())
	go forge.Loop(ctx)

	// 4. Set up the hot-patch receiver, which allows for updating rules at runtime.
	// The endpoint requires a valid signature and chain anchor for the new rules.
	http.HandleFunc("/v1/shield", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "POST only", http.StatusMethodNotAllowed)
			return
		}
		body, _ := io.ReadAll(io.LimitReader(r.Body, 2<<20)) // 2 MiB max
		if !verifier.Valid(body) {
			http.Error(w, "invalid signature or chain anchor", http.StatusUnauthorized)
			return
		}
		if err := hotpatch.Apply(body); err != nil {
			http.Error(w, err.Error(), http.StatusUnprocessableEntity)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	// 5. Set up the business API, including a health check endpoint.
	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// 6. Start the metrics server for observability.
	go func() {
		log.Println("metrics on", metricsAddr)
		if err := http.ListenAndServe(metricsAddr, expvar.Handler()); err != nil {
			log.Printf("metrics server error: %v", err)
		}
	}()

	// Create and start the main API server.
	srv := &http.Server{Addr: apiAddr, Handler: nil}
	go func() {
		log.Println("api on", apiAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("api server error: %v", err)
		}
	}()

	// Wait for the shutdown signal.
	<-ctx.Done()
	log.Println("shutting down...")

	// Create a new context for the shutdown process.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Gracefully shut down the API server.
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("server shutdown failed: %v", err)
	}
}

// loadRules loads the YARA and Sigma rules from the embedded filesystem.
// It returns a map of rule names to their content.
func loadRules() (map[string][]byte, error) {
	loadedRules := make(map[string][]byte)
	entries, err := rules.RuleFS.ReadDir(".")
	if err != nil {
		return nil, fmt.Errorf("could not read rules directory: %w", err)
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		b, err := rules.RuleFS.ReadFile(e.Name())
		if err != nil {
			return nil, fmt.Errorf("could not read rule file %s: %w", e.Name(), err)
		}
		loadedRules[e.Name()] = b
	}
	return loadedRules, nil
}
