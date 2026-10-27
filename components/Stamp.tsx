interface StampProps {
  role: 'owner' | 'editor' | 'viewer';
  className?: string;
}

export default function Stamp({ role, className = '' }: StampProps) {
  const styles = {
    owner: 'bg-[var(--paper)] text-[var(--vermilion)] border-[var(--vermilion)]',
    editor: 'bg-[var(--highlighter)] text-[var(--ink)] border-[var(--ink)]',
    viewer: 'bg-[var(--paper)] text-[var(--sage)] border-[var(--sage)]',
  };

  const label = {
    owner: 'OWNER',
    editor: 'EDITOR',
    viewer: 'VIEWER',
  };

  return (
    <span
      className={`
        inline-block px-2.5 py-0.5 
        border-[1.5px] rounded-full
        font-[family-name:var(--font-jetbrains-loaded)] 
        text-[10px] font-semibold uppercase tracking-wider
        transform -rotate-3
        stamp-appear
        ${styles[role]}
        ${className}
      `}
      style={{ opacity: 0.92 }}
    >
      {label[role]}
    </span>
  );
}
