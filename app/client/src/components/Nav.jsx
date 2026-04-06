import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Nav() {
  const { isAuthenticated, signOut } = useAuth();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <Link
        to="/home"
        className="text-sm font-semibold text-gray-900 dark:text-white mr-auto"
      >
        Cosmic Speed Draw
      </Link>

      <div className="flex items-center gap-6 text-sm">
        {isAuthenticated ? (
          <>
            <Link
              to="/home"
              className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
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
    </nav>
  );
}
