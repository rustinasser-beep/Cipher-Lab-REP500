import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declare props for TypeScript React 19 compatibility
  declare props: Props;

  state: State = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('Cipher Lab Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0f1424] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              حدث خطأ أثناء تحميل التطبيق
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {this.state.errorMessage || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all shadow-md shadow-amber-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة التحميل (Reload)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
