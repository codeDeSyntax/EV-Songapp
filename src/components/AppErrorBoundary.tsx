import React from "react";

interface AppErrorBoundaryState {
  hasError: boolean;
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[AppErrorBoundary] Renderer error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full border border-white/20 rounded-lg p-6 bg-white/5 backdrop-blur-sm text-center">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-white/80">
              The app recovered to a safe screen. Click reload to continue.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-5 px-4 py-2 rounded bg-white/15 hover:bg-white/25 transition"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
