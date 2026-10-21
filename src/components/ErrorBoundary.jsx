import { Component } from 'react';

/** Catches render errors so a single broken view never blanks the whole app. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Thai Coach error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-6 text-center text-white">
        <h1 className="font-display text-3xl font-bold uppercase">Something went wrong</h1>
        <p className="mt-2 max-w-md text-white/60">An unexpected error occurred. Your saved progress is safe.</p>
        <a href="/" className="btn btn-primary mt-6">Back to home</a>
      </div>
    );
  }
}
