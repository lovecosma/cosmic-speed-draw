import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Nav() {
  const { isAuthenticated, signOut, user } = useAuth();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <Link
        to="/drawings"
        className="text-sm font-semibold text-gray-900 dark:text-white mr-auto"
      >
        Cosmic Speed Draw
      </Link>

      <div className="flex flex-col items-end gap-0.5 text-sm">
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/drawings"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Drawings
              </Link>
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        {isAuthenticated && user?.email && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Signed in as {user.email}
          </span>
        )}
      </div>
    </nav>
  );
}
