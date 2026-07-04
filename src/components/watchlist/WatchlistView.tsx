import { Eye } from 'lucide-react';

export default function WatchlistView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="mb-6 w-14 h-14 rounded-xl bg-subtle border border-border flex items-center justify-center">
        <Eye className="w-6 h-6 text-textSecondary" />
      </div>
      <h1 className="font-display text-3xl font-semibold text-textPrimary mb-3 tracking-tight">
        Watchlist
      </h1>
      <p className="text-base text-textSecondary max-w-sm leading-relaxed">
        Monitor targets and their catalysts - coming soon.
      </p>
    </div>
  );
}
