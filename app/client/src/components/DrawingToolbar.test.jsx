import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DrawingToolbar from "./DrawingToolbar";

const LG_BREAKPOINT = 1024;

function setViewportWidth(width) {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
    writable: true,
  });
}

function renderToolbar(props = {}) {
  return render(
    <DrawingToolbar
      color="#000000"
      onColorChange={vi.fn()}
      strokeWidth={3}
      onStrokeWidthChange={vi.fn()}
      opacity={100}
      onOpacityChange={vi.fn()}
      {...props}
    />,
  );
}

describe("DrawingToolbar", () => {
  it("starts open when viewport width meets the lg breakpoint", () => {
    setViewportWidth(LG_BREAKPOINT);
    renderToolbar();
    expect(screen.getByText("Tools")).toBeInTheDocument();
  });

  it("starts closed when viewport width is below the lg breakpoint", () => {
    setViewportWidth(LG_BREAKPOINT - 1);
    renderToolbar();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
  });

  it("shows 'Show tools' on the sm handle when the toolbar is closed", () => {
    setViewportWidth(LG_BREAKPOINT - 1);
    renderToolbar();
    expect(screen.getByText("Show tools")).toBeInTheDocument();
  });

  it("shows 'Hide tools' on the sm handle when the toolbar is open", () => {
    setViewportWidth(LG_BREAKPOINT);
    renderToolbar();
    expect(screen.getByText("Hide tools")).toBeInTheDocument();
  });

  it("collapses the lg panel when the close icon is clicked", () => {
    setViewportWidth(LG_BREAKPOINT);
    renderToolbar();
    fireEvent.click(screen.getByText("✕"));
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
  });

  it("expands the lg panel when the expand button is clicked after collapsing", () => {
    setViewportWidth(LG_BREAKPOINT);
    renderToolbar();
    fireEvent.click(screen.getByText("✕"));
    fireEvent.click(
      screen.getAllByRole("button", { name: "Expand toolbar" })[0],
    );
    expect(screen.getByText("Tools")).toBeInTheDocument();
  });

  it("opens the sm sheet when the closed handle is clicked", () => {
    setViewportWidth(LG_BREAKPOINT - 1);
    renderToolbar();
    fireEvent.click(screen.getByText("Show tools"));
    expect(screen.getByText("Hide tools")).toBeInTheDocument();
  });

  it("closes the sm sheet when the open handle is clicked", () => {
    setViewportWidth(LG_BREAKPOINT - 1);
    renderToolbar();
    fireEvent.click(screen.getByText("Show tools"));
    fireEvent.click(screen.getByText("Hide tools"));
    expect(screen.getByText("Show tools")).toBeInTheDocument();
  });

  it("passes strokeWidth to the stroke width pickers", () => {
    setViewportWidth(LG_BREAKPOINT);
    renderToolbar({ strokeWidth: 15 });
    expect(
      screen.getAllByRole("slider", { name: "Stroke width" })[0],
    ).toHaveValue("15");
  });

  it("passes opacity to the opacity pickers", () => {
    setViewportWidth(LG_BREAKPOINT);
    renderToolbar({ opacity: 60 });
    expect(screen.getAllByRole("slider", { name: "Opacity" })[0]).toHaveValue(
      "60",
    );
  });

  it("calls onStrokeWidthChange with a numeric value when the stroke width slider changes", () => {
    setViewportWidth(LG_BREAKPOINT);
    const onStrokeWidthChange = vi.fn();
    renderToolbar({ onStrokeWidthChange });
    fireEvent.change(
      screen.getAllByRole("slider", { name: "Stroke width" })[0],
      {
        target: { value: "20" },
      },
    );
    expect(onStrokeWidthChange).toHaveBeenCalledWith(20);
  });

  it("calls onOpacityChange with a numeric value when the opacity slider changes", () => {
    setViewportWidth(LG_BREAKPOINT);
    const onOpacityChange = vi.fn();
    renderToolbar({ onOpacityChange });
    fireEvent.change(screen.getAllByRole("slider", { name: "Opacity" })[0], {
      target: { value: "50" },
    });
    expect(onOpacityChange).toHaveBeenCalledWith(50);
  });
});
