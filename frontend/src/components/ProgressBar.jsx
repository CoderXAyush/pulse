export default function ProgressBar({ value = 0, label = "Progress" }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-zinc-900 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
