import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ColorPalette from "./ColorPalette";

vi.mock("react-color", () => ({
  SketchPicker: ({ color, onChangeComplete, disableAlpha }) => (
    <div
      data-testid="sketch-picker"
      data-color={color}
      data-disable-alpha={String(disableAlpha)}
    >
      <button onClick={() => onChangeComplete({ hex: "#ff0000" })}>pick</button>
    </div>
  ),
}));

// Re-import after mock is registered
const { default: ColorPaletteUnderTest } = await import("./ColorPalette");

function renderPalette(props = {}) {
  return render(
    <ColorPaletteUnderTest color="#000000" onChange={vi.fn()} {...props} />,
  );
}

describe("ColorPalette", () => {
  it("passes the current color to SketchPicker", () => {
    const { getByTestId } = renderPalette({ color: "#3b82f6" });
    expect(getByTestId("sketch-picker")).toHaveAttribute(
      "data-color",
      "#3b82f6",
    );
  });

  it("calls onChange with the hex value when a color is picked", async () => {
    const onChange = vi.fn();
    const { getByRole } = renderPalette({ onChange });

    getByRole("button", { name: "pick" }).click();

    expect(onChange).toHaveBeenCalledWith("#ff0000");
  });

  it("disables the alpha channel", () => {
    const { getByTestId } = renderPalette();
    expect(getByTestId("sketch-picker")).toHaveAttribute(
      "data-disable-alpha",
      "true",
    );
  });
});
