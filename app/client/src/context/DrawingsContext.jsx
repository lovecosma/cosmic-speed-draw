import { useState, useCallback } from "react";
import { DrawingsContext } from "./drawings-context";
import { useAuth } from "./useAuth";

export function DrawingsProvider({ children }) {
  const { authFetch } = useAuth();
  const [drawings, setDrawings] = useState(null); // null = not yet loaded

  const fetchDrawings = useCallback(() => {
    return authFetch("/api/drawings")
      .then((res) => res.json())
      .then(setDrawings);
  }, [authFetch]);

  const addDrawing = useCallback((drawing) => {
    setDrawings((prev) => (prev ? [drawing, ...prev] : [drawing]));
  }, []);

  const removeDrawing = useCallback((id) => {
    setDrawings((prev) => prev?.filter((d) => d.id !== id) ?? prev);
  }, []);

  const updateDrawing = useCallback((drawing) => {
    setDrawings(
      (prev) => prev?.map((d) => (d.id === drawing.id ? drawing : d)) ?? prev,
    );
  }, []);

  return (
    <DrawingsContext.Provider
      value={{
        drawings,
        fetchDrawings,
        addDrawing,
        removeDrawing,
        updateDrawing,
      }}
    >
      {children}
    </DrawingsContext.Provider>
  );
}
