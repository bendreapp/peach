export default function PaymentsLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="h-8 w-40 bg-border rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-card border border-border animate-pulse" />
        ))}
      </div>
      <div className="h-10 bg-border rounded-small animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-surface rounded-card border border-border animate-pulse" />
        ))}
      </div>
    </div>
  );
}
