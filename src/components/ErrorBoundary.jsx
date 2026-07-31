import React from "react";

/**
 * Last line of defense against blank-screen crashes.
 *
 * The immediate cause of the "422 invite -> blank screen" bug was fixed
 * at the source (see utils/apiError.js — never pass a raw object into
 * toast.error again). This boundary is the safety net for everything
 * else: without it, ANY uncaught render error, anywhere in the app,
 * unmounts the whole React tree and leaves the user staring at a blank
 * page with no way back except a manual refresh.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
            <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-500">
              This page hit an unexpected error. Your data is safe — try going back to the
              dashboard.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
