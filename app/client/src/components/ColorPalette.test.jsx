import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ColorPalette from "./ColorPalette";

vi.mock("react-colorful", () => ({
  HexColorPicker: ({ color, onChange }) => (
    <div data-testid="hex-color-picker" data-color={color}>
      <button onClick={() => onChange("#ff0000")}>pick</button>
    </div>
  ),
}));

function renderPalette(props = {}) {
  return render(<ColorPalette color="#000000" onChange={vi.fn()} {...props} />);
}

describe("ColorPalette", () => {
  it("passes the current color to HexColorPicker", () => {
    const { getByTestId } = renderPalette({ color: "#3b82f6" });
    expect(getByTestId("hex-color-picker")).toHaveAttribute(
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

  it("calls onChange only once per pick", async () => {
    const onChange = vi.fn();
    const { getByRole } = renderPalette({ onChange });

    getByRole("button", { name: "pick" }).click();

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
