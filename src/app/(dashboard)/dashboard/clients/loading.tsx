export default function ClientsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-border rounded-lg" />
        <div className="h-9 w-28 bg-border rounded-small" />
      </div>
      <div className="bg-surface rounded-card border border-border divide-y divide-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-border" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-border rounded" />
              <div className="h-3 w-48 bg-border rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
