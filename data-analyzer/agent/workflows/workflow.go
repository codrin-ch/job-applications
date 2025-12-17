package workflows

import "context"

// Workflow is the interface that all workflows must implement
type Workflow[T any] interface {
	Execute(ctx context.Context) (T, error)
}
