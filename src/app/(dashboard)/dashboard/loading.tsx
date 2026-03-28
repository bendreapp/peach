export default function DashboardLoading() {
  return (
    <div className="max-w-3xl space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-border rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-card border border-border" />
        ))}
      </div>
      <div className="h-64 bg-surface rounded-card border border-border" />
    </div>
  );
}
