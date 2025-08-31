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
}

// THIS IS THE CRITICAL PART: We are defining a "class" not a "const function".
// A class component has access to `this.props` and `this.state`.
class ErrorBoundary extends React.Component<Props, State> {
  
  // This is the internal state of the component.
  public state: State = {
    hasError: false,
  };

  // This special lifecycle method catches errors from child components.
  public static getDerivedStateFromError(error: Error): State {
    // When an error happens, we update our state to show the fallback UI.
    return { hasError: true, error };
  }

  // This special lifecycle method is for logging the error details.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  // The `render` method is what tells React what to display.
  public render() {
    // If our state shows an error, we display the fallback.
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex items-center justify-center h-screen bg-red-50 p-4">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-200">
            <h1 className="text-2xl font-bold text-red-800">Something Went Wrong</h1>
            <p className="mt-2 text-slate-600">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
            
            {/* This code shows the error details only in development mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-4 p-2 text-left text-xs text-red-700 bg-red-100 rounded overflow-auto">
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    // If there is no error, we just render the children components as normal.
    return this.props.children;
  }
}

export default ErrorBoundary;
// --- END OF FILE: src/components/ErrorBoundary.tsx ---