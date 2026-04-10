import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DrawingsContext } from "../context/drawings-context";
import { AuthContext } from "../context/auth-context";
import DrawingPage from "./DrawingPage";

vi.mock("react-colorful", () => ({
  HexColorPicker: ({ onChange }) => (
    <button onClick={() => onChange("#ef4444")}>pick color</button>
  ),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "42" }),
  useNavigate: () => mockNavigate,
}));

function makeCanvasCtx() {
  return {
    fillStyle: "",
    fillRect: vi.fn(),
    lineJoin: "",
    lineCap: "",
    globalCompositeOperation: "",
    strokeStyle: "",
    lineWidth: 0,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
    putImageData: vi.fn(),
    toDataURL: vi.fn(() => "data:image/png;base64,test"),
  };
}

function renderPage(authFetch) {
  return render(
    <AuthContext.Provider
      value={{ authFetch, isAuthenticated: true, loading: false, user: null }}
    >
      <DrawingsContext.Provider
        value={{
          removeDrawing: vi.fn(),
          updateDrawing: vi.fn(),
          drawings: [],
          fetchDrawings: vi.fn(),
          addDrawing: vi.fn(),
        }}
      >
        <DrawingPage />
      </DrawingsContext.Provider>
    </AuthContext.Provider>,
  );
}

describe("DrawingPage — save status colour", () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => makeCanvasCtx());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies text-red-500 to 'Save failed' when the autosave request fails", async () => {
    const authFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // GET on mount
      .mockResolvedValueOnce({ ok: false }); // PATCH autosave

    renderPage(authFetch);

    // Let the mount GET settle
    await act(async () => {});

    // Simulate a draw stroke so stopDrawing schedules the autosave
    const canvas = document.querySelector("canvas");
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(canvas);

    // Advance past the 2 s autosave delay and drain the resulting promises
    await act(async () => {
      vi.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();
    });

    const status = screen.getByText("Save failed");
    expect(status).toHaveClass("text-red-500");
  });
});

describe("DrawingPage — color palette", () => {
  let canvasCtx;
  let authFetch;

  beforeEach(() => {
    canvasCtx = makeCanvasCtx();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => canvasCtx);
    authFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("renders the color palette", async () => {
    renderPage(authFetch);
    await act(async () => {});

    expect(
      screen.getByRole("button", { name: "pick color" }),
    ).toBeInTheDocument();
  });

  it("switching from eraser to a color activates the pen tool", async () => {
    renderPage(authFetch);
    await act(async () => {});

    await userEvent.click(screen.getByRole("button", { name: "Eraser" }));
    await userEvent.click(screen.getByRole("button", { name: "pick color" }));

    expect(screen.getByRole("button", { name: "Pen" })).toHaveClass("bg-black");
  });

  it("uses the selected color as the canvas stroke style", async () => {
    renderPage(authFetch);
    await act(async () => {});

    await userEvent.click(screen.getByRole("button", { name: "pick color" }));

    const canvas = document.querySelector("canvas");
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

    expect(canvasCtx.strokeStyle).toBe("#ef4444");
  });
});

describe("DrawingPage — stroke width", () => {
  let canvasCtx;
  let authFetch;

  beforeEach(() => {
    canvasCtx = makeCanvasCtx();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => canvasCtx);
    authFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("renders the stroke width slider", async () => {
    renderPage(authFetch);
    await act(async () => {});

    expect(
      screen.getByRole("slider", { name: "Stroke width" }),
    ).toBeInTheDocument();
  });

  it("pen strokes use the current strokeWidth as canvas lineWidth", async () => {
    renderPage(authFetch);
    await act(async () => {});

    fireEvent.change(screen.getByRole("slider", { name: "Stroke width" }), {
      target: { value: "15" },
    });

    const canvas = document.querySelector("canvas");
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

    expect(canvasCtx.lineWidth).toBe(15);
  });

  it("eraser strokes use the current strokeWidth as canvas lineWidth", async () => {
    renderPage(authFetch);
    await act(async () => {});

    fireEvent.change(screen.getByRole("slider", { name: "Stroke width" }), {
      target: { value: "18" },
    });

    await userEvent.click(screen.getByRole("button", { name: "Eraser" }));

    const canvas = document.querySelector("canvas");
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

    expect(canvasCtx.lineWidth).toBe(18);
  });

  it("pen tool cursor uses the crosshair fallback", async () => {
    renderPage(authFetch);
    await act(async () => {});

    const canvas = document.querySelector("canvas");
    expect(canvas.style.cursor).toContain("crosshair");
  });

  it("eraser tool cursor uses the cell fallback", async () => {
    renderPage(authFetch);
    await act(async () => {});

    await userEvent.click(screen.getByRole("button", { name: "Eraser" }));

    const canvas = document.querySelector("canvas");
    expect(canvas.style.cursor).toContain("cell");
  });

  it("pen and eraser cursors are distinct values", async () => {
    renderPage(authFetch);
    await act(async () => {});

    const canvas = document.querySelector("canvas");
    const penCursor = canvas.style.cursor;

    await userEvent.click(screen.getByRole("button", { name: "Eraser" }));

    expect(canvas.style.cursor).not.toBe(penCursor);
  });

  it("eraser cursor changes when strokeWidth changes", async () => {
    renderPage(authFetch);
    await act(async () => {});

    await userEvent.click(screen.getByRole("button", { name: "Eraser" }));

    const canvas = document.querySelector("canvas");
    const initialCursor = canvas.style.cursor;

    fireEvent.change(screen.getByRole("slider", { name: "Stroke width" }), {
      target: { value: "30" },
    });

    expect(canvas.style.cursor).not.toBe(initialCursor);
  });

  it("updating strokeWidth is reflected on subsequent strokes", async () => {
    renderPage(authFetch);
    await act(async () => {});

    const slider = screen.getByRole("slider", { name: "Stroke width" });
    const canvas = document.querySelector("canvas");

    fireEvent.change(slider, { target: { value: "5" } });
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);

    fireEvent.change(slider, { target: { value: "30" } });
    fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30 });
    fireEvent.mouseMove(canvas, { clientX: 40, clientY: 40 });

    expect(canvasCtx.lineWidth).toBe(30);
  });
});
