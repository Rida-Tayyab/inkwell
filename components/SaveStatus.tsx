'use client';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusProps {
  state: SaveState;
  lastSaved?: Date;
  onRetry?: () => void;
}

export default function SaveStatus({ state, lastSaved, onRetry }: SaveStatusProps) {
  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  if (state === 'idle' && !lastSaved) return null;

  return (
    <div className="font-[family-name:var(--font-jetbrains-loaded)] text-xs uppercase tracking-wider">
      {state === 'saving' && (
        <span className="text-[var(--ink-soft)]">Saving…</span>
      )}

      {state === 'saved' && lastSaved && (
        <span className="text-[var(--ink-soft)] relative">
          <span className="inline-block">Saved {formatTime(lastSaved)}</span>
          <span 
            className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--highlighter)] animate-flash"
            style={{
              animation: 'flash 600ms ease-out',
            }}
          />
        </span>
      )}

      {state === 'error' && (
        <span className="text-[var(--vermilion)]">
          Not saved.{' '}
          {onRetry && (
            <button onClick={onRetry} className="underline hover:no-underline">
              Retry
            </button>
          )}
        </span>
      )}

      <style jsx>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
