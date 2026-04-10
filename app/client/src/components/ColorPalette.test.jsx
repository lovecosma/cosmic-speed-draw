import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ColorPalette from "./ColorPalette";

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

function renderPalette(props = {}) {
  return render(
    <ColorPalette color={COLORS[0]} onChange={vi.fn()} {...props} />,
  );
}

describe("ColorPalette", () => {
  it("renders a swatch button for every color", () => {
    renderPalette();
    expect(screen.getAllByRole("button")).toHaveLength(COLORS.length);
  });

  it("calls onChange with the clicked color", async () => {
    const onChange = vi.fn();
    renderPalette({ onChange });

    await userEvent.click(screen.getByLabelText("#ef4444"));

    expect(onChange).toHaveBeenCalledWith("#ef4444");
  });

  it("calls onChange only once per click", async () => {
    const onChange = vi.fn();
    renderPalette({ onChange });

    await userEvent.click(screen.getByLabelText("#3b82f6"));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("marks the active swatch with the accent border class", () => {
    renderPalette({ color: "#22c55e" });

    expect(screen.getByLabelText("#22c55e")).toHaveClass(
      "border-[var(--accent)]",
    );
  });

  it("does not mark inactive swatches with the accent border class", () => {
    renderPalette({ color: "#22c55e" });

    const inactive = screen.getByLabelText("#ef4444");
    expect(inactive).not.toHaveClass("border-[var(--accent)]");
  });
});
