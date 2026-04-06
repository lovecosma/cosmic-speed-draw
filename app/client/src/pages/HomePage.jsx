import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function HomePage() {
  const { user, loading, isProvisional, signOut } = useAuth();

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
      {isProvisional ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            You're browsing as a guest.
          </p>
          <div className="flex gap-3">
            <Link
              to="/signup"
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Sign up to save your work
            </Link>
            <Link
              to="/login"
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-700 dark:text-gray-300">
            Signed in as <strong>{user.email}</strong>
          </p>
          <button
            onClick={signOut}
            className="text-sm text-red-600 hover:underline"
          >
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
