import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
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
    canvas.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, clientX: 10, clientY: 10 }),
    );
    canvas.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    canvas.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, clientX: 10, clientY: 10 }),
    );
    canvas.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 20, clientY: 20 }),
    );

    expect(canvasCtx.strokeStyle).toBe("#ef4444");
  });
});
