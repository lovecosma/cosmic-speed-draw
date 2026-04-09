import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { DrawingsProvider } from "./context/DrawingsContext";
import Nav from "./components/Nav";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DrawingPage from "./pages/DrawingPage";
import DrawingsPage from "./pages/DrawingsPage";

// Redirects real (non-provisional) users away from guest-only pages.
// Provisional users can still visit login/signup to upgrade their account.
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/drawings" replace />;
}

// Defers rendering until auth bootstrap completes, preventing child routes
// from making API requests before the session cookie is available.
function AuthReady({ children }) {
  const { loading } = useAuth();
  if (loading) return null;
  return children;
}

export default function App() {
  return (
    <>
      <Nav />
      <main className="pt-14">
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <SignUpPage />
              </GuestRoute>
            }
          />
          <Route
            element={
              <AuthReady>
                <DrawingsProvider>
                  <Outlet />
                </DrawingsProvider>
              </AuthReady>
            }
          >
            <Route path="/drawings" element={<DrawingsPage />} />
            <Route path="/drawings/:id" element={<DrawingPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/drawings" replace />} />
        </Routes>
      </main>
    </>
  );
}
