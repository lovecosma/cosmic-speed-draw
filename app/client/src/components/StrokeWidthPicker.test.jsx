import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StrokeWidthPicker from "./StrokeWidthPicker";

function renderPicker(props = {}) {
  return render(
    <StrokeWidthPicker strokeWidth={3} onChange={vi.fn()} {...props} />,
  );
}

describe("StrokeWidthPicker", () => {
  it("sets the slider value to the current strokeWidth", () => {
    renderPicker({ strokeWidth: 12 });
    expect(screen.getByRole("slider", { name: "Stroke width" })).toHaveValue(
      "12",
    );
  });

  it("renders a label showing the current strokeWidth in px", () => {
    renderPicker({ strokeWidth: 7 });
    expect(screen.getByText("7px")).toBeInTheDocument();
  });

  it("sets the preview stroke height to the current strokeWidth", () => {
    renderPicker({ strokeWidth: 10 });
    expect(screen.getByTestId("stroke-preview")).toHaveStyle({
      height: "10px",
    });
  });

  it("sets the preview stroke background color to the current color", () => {
    renderPicker({ color: "#ef4444" });
    expect(screen.getByTestId("stroke-preview")).toHaveStyle({
      backgroundColor: "#ef4444",
    });
  });

  it("sets the preview stroke opacity to the current opacity", () => {
    renderPicker({ opacity: 40 });
    expect(screen.getByTestId("stroke-preview")).toHaveStyle({ opacity: 0.4 });
  });

  it("slider minimum is 1", () => {
    renderPicker();
    expect(
      screen.getByRole("slider", { name: "Stroke width" }),
    ).toHaveAttribute("min", "1");
  });

  it("slider maximum is 40", () => {
    renderPicker();
    expect(
      screen.getByRole("slider", { name: "Stroke width" }),
    ).toHaveAttribute("max", "40");
  });

  it("calls onChange with a numeric value when the slider changes", () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    fireEvent.change(screen.getByRole("slider", { name: "Stroke width" }), {
      target: { value: "20" },
    });
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it("calls onChange once per change event", () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    fireEvent.change(screen.getByRole("slider", { name: "Stroke width" }), {
      target: { value: "20" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
