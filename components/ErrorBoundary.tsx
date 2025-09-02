// --- START OF FILE: src/components/ErrorBoundary.tsx ---
import React, { Component, ErrorInfo, ReactNode } from 'react';

// This defines the types for the component's props (what it receives)
// and its internal state.
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// THIS IS THE CRITICAL PART: We are defining a "class" not a "const function".
// A class component has access to `this.props` and `this.state`.
class ErrorBoundary extends Component<Props, State> {
  
  // This is the internal state of the component.
  public state: State = {
    hasError: false,
  };

  // This special lifecycle method catches errors from child components.
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h2>
            <p className="text-slate-700 mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRefresh}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition font-medium"
              >
                Try Again
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800 font-medium">
                  Technical Details
                </summary>
                <div className="mt-3 p-3 bg-slate-100 rounded text-xs">
                  <div className="font-medium text-slate-800 mb-2">Error:</div>
                  <pre className="text-slate-700 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <div className="font-medium text-slate-800 mt-3 mb-2">Stack Trace:</div>
                      <pre className="text-slate-700 whitespace-pre-wrap break-words text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
            <div className="mt-4 text-xs text-slate-500">
              If this error persists, please contact{' '}
              <a 
                href="mailto:support.nextmile@crashfreeindia.org" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                support.nextmile@crashfreeindia.org
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;