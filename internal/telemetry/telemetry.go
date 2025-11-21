package telemetry

import "context"

type Event struct{}

type Telemetry struct{}

func New(rules map[string][]byte) *Telemetry {
	return &Telemetry{}
}

func (t *Telemetry) Stream(ctx context.Context) {}

func (t *Telemetry) Events() <-chan Event {
	return make(chan Event)
}
