'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-800 bg-red-950/20 p-6 space-y-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              {this.props.name ? `${this.props.name} failed to load` : 'Component error'}
            </span>
          </div>
          <pre className="text-xs text-red-300 bg-red-950/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
            {this.state.error?.message || 'Unknown error'}
            {this.state.error?.stack && (
              <>
                {'\n\n'}
                {this.state.error.stack}
              </>
            )}
          </pre>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="border-red-700 text-red-400 hover:bg-red-950/50"
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
