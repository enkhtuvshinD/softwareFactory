interface BarRowProps {
  label: string;
  value: number;
  max: number;
  tone: string;
}

export function BarRow({ label, value, max, tone }: BarRowProps) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track" aria-hidden="true">
        <span className={`bar-fill bar-${tone}`} style={{ width: `${percent}%` }} />
      </span>
      <span className="bar-value">{value}</span>
    </div>
  );
}
