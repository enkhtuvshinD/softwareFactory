interface StatCardProps {
  label: string;
  value: string | number;
  testId: string;
}

export function StatCard({ label, value, testId }: StatCardProps) {
  return (
    <div className="card stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" data-testid={testId}>
        {value}
      </p>
    </div>
  );
}
