import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and display errors gracefully
 * Prevents the entire app from crashing when a component error occurs
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="h-full bg-panel-bg border border-red-500 rounded-lg p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-red-500">⚠️ Something went wrong</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary mb-2">
                An error occurred while rendering this component. This has been logged and you can try to continue using the app.
              </p>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-80 transition-colors"
              >
                Try Again
              </button>
            </div>

            {this.state.error && (
              <div className="mt-4 p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded text-xs">
                <div className="font-semibold text-red-400 mb-2">Error Details:</div>
                <div className="text-text-secondary break-words">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-400">Stack Trace</summary>
                    <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
