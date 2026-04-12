import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OpacityPicker from "./OpacityPicker";

function renderPicker(props = {}) {
  return render(<OpacityPicker opacity={100} onChange={vi.fn()} {...props} />);
}

describe("OpacityPicker", () => {
  it("sets the slider value to the current opacity", () => {
    renderPicker({ opacity: 50 });
    expect(screen.getByRole("slider", { name: "Opacity" })).toHaveValue("50");
  });

  it("renders a label showing the current opacity as a percentage", () => {
    renderPicker({ opacity: 75 });
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("sets the preview dot opacity to the current opacity", () => {
    renderPicker({ opacity: 40 });
    expect(screen.getByTestId("opacity-preview")).toHaveStyle({ opacity: 0.4 });
  });

  it("sets the preview dot background color to the current color", () => {
    renderPicker({ color: "#ef4444" });
    expect(screen.getByTestId("opacity-preview")).toHaveStyle({
      backgroundColor: "#ef4444",
    });
  });

  it("slider minimum is 1", () => {
    renderPicker();
    expect(screen.getByRole("slider", { name: "Opacity" })).toHaveAttribute(
      "min",
      "1",
    );
  });

  it("slider maximum is 100", () => {
    renderPicker();
    expect(screen.getByRole("slider", { name: "Opacity" })).toHaveAttribute(
      "max",
      "100",
    );
  });

  it("calls onChange with a numeric value when the slider changes", () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    fireEvent.change(screen.getByRole("slider", { name: "Opacity" }), {
      target: { value: "60" },
    });
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it("calls onChange once per change event", () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    fireEvent.change(screen.getByRole("slider", { name: "Opacity" }), {
      target: { value: "60" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
