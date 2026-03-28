export default function ScheduleLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-border rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-border rounded-small" />
          <div className="h-9 w-32 bg-border rounded-small" />
        </div>
      </div>
      <div className="bg-surface rounded-card border border-border h-[600px]" />
    </div>
  );
}
