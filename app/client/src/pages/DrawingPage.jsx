import cn from "classnames";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useDrawings } from "../context/useDrawings";
import ColorPalette from "../components/ColorPalette";
import StrokeWidthPicker from "../components/StrokeWidthPicker";

const TOOL_PEN = "pen";
const TOOL_ERASER = "eraser";
const AUTOSAVE_DELAY_MS = 2000;
const DEFAULT_COLOR = "#000000";
const CANVAS_BG = "#ffffff";
const MAX_UNDO_STACK = 20;
const MAX_REDO_STACK = 20;

function makeEraserCursor(size) {
  const pad = 4;
  const dim = size + pad;
  const center = dim / 2;
  const hotspot = Math.round(center);
  const r = size / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}">` +
    `<circle cx="${center}" cy="${center}" r="${r}" fill="white" stroke="#555" stroke-width="1.5"/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspot} ${hotspot}, cell`;
}

// getPos is pure — no component state closed over
function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  if (e.touches) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

const PENCIL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">' +
  '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" fill="#1a1a1a" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
  "</svg>";
// Hotspot (2, 18): pencil tip sits at (2, 22) in the 24×24 viewBox, scaled to the 20×20 render size → (2/24*20, 22/24*20) ≈ (2, 18)
const PEN_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(PENCIL_SVG)}") 2 18, crosshair`;

export default function DrawingPage() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const { removeDrawing, updateDrawing } = useDrawings();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const autosaveTimer = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const hasDrawnInStroke = useRef(false);
  const [tool, setTool] = useState(TOOL_PEN);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [canvasScale, setCanvasScale] = useState(1);
  const eraserCursor = useMemo(
    () => makeEraserCursor(Math.round(strokeWidth * canvasScale)),
    [strokeWidth, canvasScale],
  );
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saving" | "saved" | "error" | null
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    authFetch(`/api/drawings/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const dataUrl = data.canvas_data?.data_url;
        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = dataUrl;
      });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const autosave = useCallback(() => {
    setSaveStatus("saving");
    const dataUrl = canvasRef.current.toDataURL("image/png");
    authFetch(`/api/drawings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ drawing: { canvas_data: dataUrl } }),
    }).then((res) => {
      if (res.ok) {
        res.json().then((updated) => updateDrawing(updated));
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    });
  }, [id, authFetch, updateDrawing]);

  const scheduleAutosave = useCallback(() => {
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(autosave, AUTOSAVE_DELAY_MS);
  }, [autosave]);

  useEffect(() => () => clearTimeout(autosaveTimer.current), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const update = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) setCanvasScale(rect.width / canvas.width);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const pushRedo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoStack.current.push(snapshot);
    if (redoStack.current.length > MAX_REDO_STACK) redoStack.current.shift();
    setCanRedo(true);
  }, []);

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(snapshot);
    if (undoStack.current.length > MAX_UNDO_STACK) {
      undoStack.current.shift();
    }
    setCanUndo(true);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = undoStack.current.pop();
    pushRedo();
    ctx.putImageData(snapshot, 0, 0);
    setCanUndo(undoStack.current.length > 0);
    scheduleAutosave();
  }, [scheduleAutosave, pushRedo]);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = redoStack.current.pop();
    pushUndo();
    ctx.putImageData(snapshot, 0, 0);
    setCanRedo(redoStack.current.length > 0);
    scheduleAutosave();
  }, [scheduleAutosave, pushUndo]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo]);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    canvasRef.current.focus();
    hasDrawnInStroke.current = false;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
    setSaveStatus(null);
  }, []);

  const draw = useCallback(
    (e) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      if (!hasDrawnInStroke.current) {
        pushUndo();
        if (redoStack.current.length > 0) {
          redoStack.current = [];
          setCanRedo(false);
        }
        hasDrawnInStroke.current = true;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const pos = getPos(e, canvas);

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "source-over";

      if (tool === TOOL_ERASER) {
        ctx.strokeStyle = CANVAS_BG;
      } else {
        ctx.strokeStyle = color;
      }
      ctx.lineWidth = strokeWidth;

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPos.current = pos;
    },
    [tool, color, strokeWidth, pushUndo],
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
    scheduleAutosave();
  }, [scheduleAutosave]);

  const handleColorChange = useCallback((c) => {
    setColor(c);
    setTool(TOOL_PEN);
  }, []);

  const handleClear = useCallback(() => {
    pushUndo();
    if (redoStack.current.length > 0) {
      redoStack.current = [];
      setCanRedo(false);
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    scheduleAutosave();
  }, [pushUndo, scheduleAutosave]);

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4">
      <h1 className="text-[28px] mt-0 mb-1">Draw</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTool(TOOL_PEN)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            tool === TOOL_PEN
              ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
              : "bg-transparent text-gray-600 border-gray-300 hover:border-gray-500 dark:text-gray-300 dark:border-gray-600"
          }`}
        >
          Pen
        </button>
        <button
          onClick={() => setTool(TOOL_ERASER)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            tool === TOOL_ERASER
              ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
              : "bg-transparent text-gray-600 border-gray-300 hover:border-gray-500 dark:text-gray-300 dark:border-gray-600"
          }`}
        >
          Eraser
        </button>
        <div
          className="w-px h-6 bg-gray-300 dark:bg-gray-600"
          aria-hidden="true"
        />
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Redo
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:border-red-400 text-gray-600 hover:text-red-500 dark:text-gray-300 dark:border-gray-600 transition-colors"
        >
          Clear
        </button>

        {confirmDelete ? (
          <>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Delete?
            </span>
            <button
              onClick={async () => {
                await authFetch(`/api/drawings/${id}`, { method: "DELETE" });
                removeDrawing(Number(id));
                navigate("/drawings");
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors"
          >
            Delete
          </button>
        )}

        <span
          className={cn(
            "text-xs w-16 text-left",
            saveStatus === "error" ? "text-red-500" : "text-[var(--text)]",
          )}
        >
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Save failed"}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          tabIndex={0}
          className="border border-[var(--border)] rounded-lg max-w-full touch-none bg-white outline-none"
          style={{
            cursor: tool === TOOL_ERASER ? eraserCursor : PEN_CURSOR,
          }}
        />
        <div className="flex flex-col items-center gap-0 w-[200px]">
          <ColorPalette color={color} onChange={handleColorChange} />
          <StrokeWidthPicker
            strokeWidth={strokeWidth}
            onChange={setStrokeWidth}
          />
        </div>
      </div>
    </div>
  );
}
