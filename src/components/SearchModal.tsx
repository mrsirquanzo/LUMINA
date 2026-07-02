import { useEffect, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

export default function SearchModal({ open, onClose, onSearch }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query);
      onClose();
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl bg-surfaceElevated border border-white/10 rounded-2xl shadow-2xl animate-modal-enter">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Sonny anything about your target..."
              className="flex-1 bg-surface border border-white/10 rounded-lg px-4 py-3 text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface text-textSecondary hover:text-textPrimary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-textTertiary">
            <span>Press Enter to search, Esc to close</span>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
