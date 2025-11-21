#!/usr/bin/env bash
set -euo pipefail
COMMIT=$(git rev-parse --short HEAD)
go mod tidy
go build -trimpath -ldflags="-s -w -X main.commit=$COMMIT" -o shieldd ./cmd/shieldd
echo "Binary: shieldd (commit $COMMIT)"
