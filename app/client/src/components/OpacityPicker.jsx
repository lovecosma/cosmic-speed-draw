export default function OpacityPicker({ opacity, onChange }) {
  return (
    <div className="flex flex-col items-center gap-2 w-full pt-2">
      <div className="flex items-center justify-center w-full h-14 bg-white dark:bg-gray-900 border border-[var(--border)] rounded-lg">
        <div
          data-testid="opacity-preview"
          className="rounded-full bg-black dark:bg-white"
          style={{ width: 20, height: 20, opacity: opacity / 100 }}
        />
      </div>
      <input
        type="range"
        min={1}
        max={100}
        value={opacity}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-black dark:accent-white"
        aria-label="Opacity"
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {opacity}%
      </span>
    </div>
  );
}
