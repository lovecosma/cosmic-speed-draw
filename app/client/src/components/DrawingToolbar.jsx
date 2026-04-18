import { useState } from "react";
import ColorPalette from "./ColorPalette";
import StrokeWidthPicker from "./StrokeWidthPicker";
import OpacityPicker from "./OpacityPicker";

export const LG_BREAKPOINT = 1024;

export default function DrawingToolbar({
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  opacity,
  onOpacityChange,
}) {
  const [isOpen, setIsOpen] = useState(
    () => window.innerWidth >= LG_BREAKPOINT,
  );

  return (
    <>
      {/* ── Large screens (lg+): fixed panel on the right ── */}
      <div className="hidden lg:block fixed right-4 top-20 z-50">
        {isOpen ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-lg w-[216px] flex flex-col overflow-hidden">
            {/* Title bar */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Collapse toolbar"
              className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] select-none cursor-pointer w-full"
            >
              <span className="text-xs font-medium text-[var(--text)]">
                Tools
              </span>
              <span
                aria-hidden="true"
                className="text-[var(--text)] hover:text-[var(--text-h)] leading-none text-base"
              >
                ✕
              </span>
            </button>

            {/* Pickers */}
            <div className="flex flex-col items-center px-5 py-8 gap-6">
              <ColorPalette color={color} onChange={onColorChange} />
              <StrokeWidthPicker
                strokeWidth={strokeWidth}
                onChange={onStrokeWidthChange}
                color={color}
                opacity={opacity}
              />
              <OpacityPicker
                opacity={opacity}
                onChange={onOpacityChange}
                color={color}
              />
            </div>
          </div>
        ) : (
          /* Collapsed pill */
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Expand toolbar"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-black dark:bg-white shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              className="dark:stroke-black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Palette icon */}
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Small screens (<lg): fixed bottom sheet ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40">
        {/* Always-visible handle */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? "Collapse toolbar" : "Expand toolbar"}
          className="w-full flex flex-col items-center gap-1 pt-2 pb-1 bg-[var(--bg)] border-t border-x border-[var(--border)] rounded-t-xl"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="text-[11px] text-[var(--text)]">
            {isOpen ? "Hide tools" : "Show tools"}
          </span>
        </button>

        {/* Collapsible content */}
        <div
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out bg-[var(--bg)] border-x border-[var(--border)]"
          style={{ maxHeight: isOpen ? "400px" : "0px" }}
        >
          <div className="overflow-y-auto overflow-x-hidden max-h-[400px] flex flex-col items-center pb-6 px-5 gap-6 w-full max-w-[216px] mx-auto">
            <ColorPalette color={color} onChange={onColorChange} />
            <StrokeWidthPicker
              strokeWidth={strokeWidth}
              onChange={onStrokeWidthChange}
              color={color}
              opacity={opacity}
            />
            <OpacityPicker
              opacity={opacity}
              onChange={onOpacityChange}
              color={color}
            />
          </div>
        </div>
      </div>
    </>
  );
}
