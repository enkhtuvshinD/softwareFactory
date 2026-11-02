import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

interface SidePanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FIRST_FIELD_SELECTOR = 'input:not([type="hidden"]), select, textarea';

export function SidePanel({ title, onClose, children }: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(FIRST_FIELD_SELECTOR)?.focus();
    return () => trigger?.focus?.();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') onClose();
  }

  return (
    <div className="overlay overlay-side" onKeyDown={handleKeyDown}>
      <div ref={panelRef} className="side-panel" role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="card-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
