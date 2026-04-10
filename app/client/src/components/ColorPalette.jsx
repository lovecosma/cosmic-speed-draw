import { SketchPicker } from "react-color";

export default function ColorPalette({ color, onChange }) {
  return (
    <SketchPicker
      color={color}
      onChangeComplete={(c) => onChange(c.hex)}
      disableAlpha
    />
  );
}
