import { useState, type KeyboardEvent } from 'react';
import { Eye, Plus } from 'lucide-react';
import { useWatchlistStore } from '../../lib/watchlist/store';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';

interface WatchlistViewProps {
  onViewInFeed?: (target?: string) => void;
}

function AddTargetInput({
  value,
  onChange,
  onAdd,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
}) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a target - e.g. CDCP1"
        aria-label="Add a watchlist target"
        className="
          t-body flex-1 h-10 px-3 rounded-lg
          bg-surface border border-border text-textPrimary
          placeholder:text-textTertiary
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          transition-colors duration-150
        "
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={!value.trim()}
        aria-label="Add target"
        className="
          t-body inline-flex items-center gap-1.5 h-10 px-4 rounded-lg font-medium
          bg-primary text-white
          hover:bg-[#1E40AF] active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-150
          motion-reduce:transition-none
        "
      >
        <Plus className="w-4 h-4" />
        Add
      </button>
    </div>
  );
}

function EmptyState({
  inputValue,
  onInputChange,
  onAdd,
}: {
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="mb-5 w-14 h-14 rounded-xl bg-subtle border border-border flex items-center justify-center">
        <Eye className="w-6 h-6 text-textSecondary" />
      </div>
      <h1 className="t-h2 mb-2 text-textPrimary">
        Your watchlist is empty
      </h1>
      <p className="t-body mb-6 max-w-sm text-textSecondary">
        Add a target and Sonny will monitor it for new papers, trials, and patents.
      </p>
      <div className="w-full max-w-sm">
        <AddTargetInput
          value={inputValue}
          onChange={onInputChange}
          onAdd={onAdd}
        />
      </div>
    </div>
  );
}

interface TargetCardProps {
  target: string;
  unreadCount: number;
  onViewInFeed?: (target?: string) => void;
}

function TargetCard({ target, unreadCount, onViewInFeed }: TargetCardProps) {
  return (
    <div
      className="
        flex flex-col gap-3 p-4 rounded-xl
        bg-surface border border-border
        shadow-[0_1px_2px_rgba(15,23,42,.04),0_2px_8px_rgba(15,23,42,.035)]
        hover:shadow-[0_2px_8px_rgba(15,23,42,.08),0_4px_16px_rgba(15,23,42,.06)]
        hover:border-blue-200
        hover:-translate-y-px
        active:scale-[0.98]
        transition-all duration-200 cursor-default
        motion-reduce:transition-none motion-reduce:transform-none
      "
    >
      {/* Target name */}
      <div>
        <p className="t-h3 text-textPrimary">
          {target}
        </p>
      </div>

      {/* Signal count */}
      <p className="t-body text-textSecondary">
        {unreadCount > 0 ? `${unreadCount} new signals` : 'No new signals'}
      </p>

      {/* Catalysts - static coming soon */}
      <p className="t-meta text-textTertiary">
        Catalysts - coming soon
      </p>

      {/* Footer actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border-soft mt-auto">
        <button
          type="button"
          onClick={() => onViewInFeed?.(target)}
          className="
            t-body inline-flex items-center h-8 px-3 rounded-md font-medium
            text-textSecondary bg-transparent border border-border
            hover:bg-subtle hover:text-textPrimary
            active:scale-[0.98]
            transition-all duration-150
            motion-reduce:transition-none
          "
        >
          View in feed
        </button>
        <button
          type="button"
          onClick={() => useWatchlistStore.getState().remove(target)}
          className="
            t-body inline-flex items-center h-8 px-3 rounded-md font-medium
            text-textTertiary bg-transparent
            hover:bg-subtle hover:text-textPrimary
            active:scale-[0.98]
            transition-all duration-150
            motion-reduce:transition-none
          "
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function WatchlistView({ onViewInFeed }: WatchlistViewProps) {
  const targets = useWatchlistStore((s) => s.targets);
  const unread = useUnreadCounts(targets);
  const [inputValue, setInputValue] = useState('');

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    useWatchlistStore.getState().add(trimmed);
    setInputValue('');
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="t-h1 mb-1 text-textPrimary">
          Watchlist
        </h1>
        <p className="t-body text-textSecondary">
          Targets Sonny is monitoring for new papers, trials, and patents.
        </p>
      </div>

      {targets.length === 0 ? (
        <EmptyState
          inputValue={inputValue}
          onInputChange={setInputValue}
          onAdd={handleAdd}
        />
      ) : (
        <>
          {/* Add input row when list is non-empty */}
          <div className="mb-6 max-w-sm">
            <AddTargetInput
              value={inputValue}
              onChange={setInputValue}
              onAdd={handleAdd}
            />
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map((t) => (
              <TargetCard
                key={t}
                target={t}
                unreadCount={unread[t] ?? 0}
                onViewInFeed={onViewInFeed}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
