import { HexColorPicker } from "react-colorful";

export default function ColorPalette({ color, onChange }) {
  return <HexColorPicker color={color} onChange={onChange} />;
}
