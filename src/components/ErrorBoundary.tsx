import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Bir Şeyler Ters Gitti</h1>
              <p className="text-sm text-slate-400">
                Tarayıcı önbelleği veya uygulama verileri yenilenirken bir hata oluştu.
              </p>
              {this.state.error?.message && (
                <p className="text-xs font-mono text-red-300 bg-red-950/40 p-2.5 rounded-xl border border-red-900/50 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Sayfayı Yenile
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition cursor-pointer"
              >
                Önbelleği Temizle ve Sıfırla
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
