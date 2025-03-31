
import React, { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error boundary for catching rendering errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("UI Rendering Error:", error);
    console.error("Error details:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-700 mb-4">The application encountered an error while loading.</p>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
              {this.state.error && this.state.error.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    console.log("Starting application rendering...");
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-lg">Loading application...</p>
              </div>
            </div>
          }>
            <App />
          </Suspense>
        </ErrorBoundary>
      </StrictMode>
    );
    console.log("Application rendering completed");
  } catch (error) {
    console.error("Failed to render application:", error);
    
    // Display error message in DOM if rendering fails completely
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1 style="color: #e11d48; font-size: 24px;">Application Failed to Load</h1>
        <p style="margin-top: 16px;">There was a critical error starting the application.</p>
        <pre style="background: #f1f5f9; padding: 12px; margin-top: 16px; overflow: auto; text-align: left;">${error instanceof Error ? error.toString() : 'Unknown error'}</pre>
        <button style="margin-top: 16px; background: #0284c7; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;" onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
} else {
  console.error("Root element not found! Cannot render the application.");
  
  // Try to find the body to show error
  const body = document.body;
  if (body) {
    body.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1 style="color: #e11d48; font-size: 24px;">Critical Error</h1>
        <p style="margin-top: 16px;">The application container element was not found.</p>
        <button style="margin-top: 16px; background: #0284c7; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;" onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}
