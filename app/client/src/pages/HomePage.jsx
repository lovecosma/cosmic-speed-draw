import { useAuth } from "../context/useAuth";

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-700 dark:text-gray-300">
        Signed in as <strong>{user.email}</strong>
      </p>
      <button
        onClick={signOut}
        className="text-sm text-red-600 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
