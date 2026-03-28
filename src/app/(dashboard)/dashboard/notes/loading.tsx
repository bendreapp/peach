export default function NotesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 bg-border rounded-lg" />
        <div className="h-9 w-36 bg-border rounded-small" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-surface rounded-card border border-border" />
        ))}
      </div>
    </div>
  );
}
