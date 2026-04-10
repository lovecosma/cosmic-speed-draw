# React Client

## Stack

- **React 19** — functional components and hooks only, no class components
- **React Router v7** — file-based routing via `<Routes>` / `<Route>` in `App.jsx`
- **Tailwind CSS v4** — utility classes only; no inline styles, no CSS modules. Exception: `style={{}}` is permitted for truly dynamic values that have no Tailwind equivalent (e.g. a CSS cursor set to a data-URI SVG).
- **Context API** — current state solution; no Redux/Zustand unless complexity clearly demands it

## Context pattern

Each context is split across three files:

- `context/foo-context.js` — creates and exports the context object only
- `context/FooContext.jsx` — exports the provider component with all state and logic
- `context/useFoo.js` — exports the `useFoo` hook (throws if used outside provider)

## API calls

Use `authFetch` from `useAuth()` for any authenticated request — it transparently handles JWT refresh and retries on 401. Pass `credentials: "include"` on all fetch calls.

## Folder structure

```
src/
  components/   # Shared UI components
  context/      # Context objects, providers, hooks (see pattern above)
  pages/        # Route-level components
```

Move toward feature folders if a feature grows beyond 2–3 files.

## Key pitfalls

- Always include all referenced values in `useEffect` / `useCallback` dependency arrays
- Never use array index as `key` in lists
- Don't create objects or arrays as default prop values — they cause re-renders
- Clean up subscriptions and timers in `useEffect` return functions
