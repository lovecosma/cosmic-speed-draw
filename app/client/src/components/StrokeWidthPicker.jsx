export default function StrokeWidthPicker({
  strokeWidth,
  onChange,
  color,
  opacity,
}) {
  return (
    <div className="flex flex-col items-center gap-2 w-full pt-2">
      <div className="flex items-center justify-center w-full h-14 bg-white dark:bg-gray-900 border border-[var(--border)] rounded-lg">
        <div
          data-testid="stroke-preview"
          className="rounded-full w-4/5"
          style={{
            height: strokeWidth,
            backgroundColor: color,
            opacity: opacity / 100,
          }}
        />
      </div>
      <input
        type="range"
        min={1}
        max={40}
        value={strokeWidth}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label="Stroke width"
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {strokeWidth}px
      </span>
    </div>
  );
}
