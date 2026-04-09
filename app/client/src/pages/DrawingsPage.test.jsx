import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DrawingsContext } from "../context/drawings-context";
import { AuthContext } from "../context/auth-context";
import DrawingsPage from "./DrawingsPage";

// react-router-dom navigate mock
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

function makeAuthContext(authFetch) {
  return { authFetch, isAuthenticated: true, loading: false, user: null };
}

function makeDrawingsContext(overrides = {}) {
  return {
    drawings: [],
    fetchDrawings: vi.fn(),
    addDrawing: vi.fn(),
    removeDrawing: vi.fn(),
    ...overrides,
  };
}

function renderPage({ authFetch, drawingsCtx } = {}) {
  const drawings = drawingsCtx ?? makeDrawingsContext();
  return render(
    <AuthContext.Provider value={makeAuthContext(authFetch ?? vi.fn())}>
      <DrawingsContext.Provider value={drawings}>
        <DrawingsPage />
      </DrawingsContext.Provider>
    </AuthContext.Provider>,
  );
}

describe("DrawingsPage — drawing tiles", () => {
  it("does not render an img for a drawing with no preview_url", () => {
    const drawing = {
      id: 1,
      preview_url: null,
      updated_at: new Date().toISOString(),
    };
    renderPage({ drawingsCtx: makeDrawingsContext({ drawings: [drawing] }) });

    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("DrawingsPage — handleNewDrawing", () => {
  beforeEach(() => mockNavigate.mockReset());

  it("re-enables the New Drawing button after the POST rejects", async () => {
    const authFetch = vi.fn().mockRejectedValue(new Error("network failure"));
    renderPage({ authFetch });

    const button = screen.getByRole("button", { name: /new drawing/i });
    await userEvent.click(button);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /new drawing/i }),
      ).not.toBeDisabled(),
    );
  });
});
