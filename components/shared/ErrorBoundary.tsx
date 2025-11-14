'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Application Error
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    An unexpected error occurred. Please try refreshing the page.
                  </p>

                  <details className="mb-4">
                    <summary className="text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-700">
                      View error details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-xs font-mono text-red-600 mb-2">
                        {this.state.error?.toString()}
                      </p>
                      <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-48">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  </details>

                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                      Refresh Page
                    </button>
                    <button
                      onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
