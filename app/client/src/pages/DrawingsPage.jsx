import cn from "classnames";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useDrawings } from "../context/useDrawings";

export default function DrawingsPage() {
  const { authFetch } = useAuth();
  const { drawings, fetchDrawings, addDrawing, removeDrawing } = useDrawings();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (drawings === null) fetchDrawings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewDrawing = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await authFetch("/api/drawings", { method: "POST" });
      const data = await res.json();
      addDrawing({
        id: data.id,
        preview_url: null,
        updated_at: new Date().toISOString(),
      });
      navigate(`/drawings/${data.id}`);
    } catch {
      // network or server error — button re-enables via finally
    } finally {
      setCreating(false);
    }
  }, [creating, authFetch, addDrawing, navigate]);

  const handleDelete = useCallback(
    async (e, id) => {
      e.stopPropagation();
      await authFetch(`/api/drawings/${id}`, { method: "DELETE" });
      removeDrawing(id);
    },
    [authFetch, removeDrawing],
  );

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto w-full">
      <h1 className="text-[28px] mt-0 mb-6 text-left">My Drawings</h1>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
        <button
          onClick={handleNewDrawing}
          disabled={creating}
          className={cn(
            "aspect-square rounded-2xl border-2 border-dashed border-[var(--border)]",
            "flex flex-col items-center justify-center gap-2",
            "text-[var(--accent)] transition-colors duration-150",
            "hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]",
            creating ? "cursor-wait" : "cursor-pointer",
          )}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="text-[13px] font-medium">
            {creating ? "Creating…" : "New Drawing"}
          </span>
        </button>

        {(drawings ?? []).map((drawing) => (
          <div key={drawing.id} className="relative group">
            <button
              onClick={() => navigate(`/drawings/${drawing.id}`)}
              className="w-full aspect-square rounded-2xl border border-[var(--border)] overflow-hidden cursor-pointer p-0 bg-white transition duration-150 hover:shadow-[var(--shadow)] hover:-translate-y-0.5"
            >
              {drawing.preview_url && (
                <img
                  src={drawing.preview_url}
                  alt={`Drawing ${drawing.id}`}
                  className="w-full h-full object-cover block"
                />
              )}
            </button>
            <button
              onClick={(e) => handleDelete(e, drawing.id)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              aria-label="Delete drawing"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <line x1="1" y1="1" x2="9" y2="9" />
                <line x1="9" y1="1" x2="1" y2="9" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
