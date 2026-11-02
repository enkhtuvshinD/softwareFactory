import type { ReactNode } from 'react';

interface ChartTableProps {
  summary: string;
  children: ReactNode;
}

export function ChartTable({ summary, children }: ChartTableProps) {
  const openByDefault = window.matchMedia('(min-width: 768px)').matches;
  return (
    <details className="chart-details" open={openByDefault}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
