import { useContext } from "react";
import { DrawingsContext } from "./drawings-context";

export function useDrawings() {
  const ctx = useContext(DrawingsContext);
  if (!ctx) throw new Error("useDrawings must be used within DrawingsProvider");
  return ctx;
}
