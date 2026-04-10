import cn from "classnames";

const COLORS = [
  "#000000",
  "#6b7280",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#92400e",
];

export default function ColorPalette({ color, onChange }) {
  return (
    <div className="flex flex-col gap-2 py-1">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          aria-label={c}
          className={cn(
            "w-7 h-7 rounded-full border-2 transition-transform duration-100",
            color === c
              ? "border-[var(--accent)] scale-110 shadow-sm"
              : "border-transparent hover:scale-105 hover:border-gray-300 dark:hover:border-gray-600",
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
