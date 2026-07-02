'use client';

import { useState } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const loginPath =
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '/api/auth/login'
      : '/api/auth-login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(loginPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ password }),
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorMessage = 'Login failed';
        if (isJson) {
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch {
            errorMessage = `Server error (${response.status})`;
          }
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Success - parse JSON only if content exists
      if (isJson) {
        await response.json();
      }

      // Success
      setPassword('');
      onSuccess();
      onClose();
    } catch (err: any) {
      // Handle network errors or JSON parse errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend server is running.');
      } else if (err.message.includes('JSON')) {
        setError('Server returned invalid response. Please check backend server logs.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-surfaceElevated border border-white/10 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-textTertiary hover:text-textPrimary hover:bg-surface rounded-lg transition-colors"
          disabled={isLoading}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-textPrimary mb-2">
            Authenticate for Live Mode
          </h2>
          <p className="text-sm text-textSecondary">
            Enter the access password to use Sonny's live AI agents with real-time API responses.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-textSecondary mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              placeholder="Enter access password"
              disabled={isLoading}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger/20 border border-danger/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger flex-1">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/10 text-textSecondary rounded-lg hover:bg-surface hover:text-textPrimary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Login
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-xs text-textSecondary">
            <strong className="text-textPrimary">Default password:</strong>{' '}
            <code className="bg-surface px-1.5 py-0.5 rounded text-textPrimary font-mono">demo2024</code>
          </p>
          <p className="text-xs text-textTertiary mt-1">
            Change this in your environment variables for production.
          </p>
        </div>
      </div>
    </div>
  );
}
