import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-600">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p>Please try refreshing the page</p>
        </div>
      );
    }
    return this.props.children;
  }
}