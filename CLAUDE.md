# Kambing Cup V2

Tournament management system with live match tracking and hafalan features.

## Tech Stack

- **Framework**: React Router v7 (SSR enabled)
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (new-york style) + Radix UI primitives
- **Icons**: Lucide React
- **State**: Jotai (minimal — single user atom)
- **Realtime**: Firebase Realtime Database
- **REST API**: Custom backend at `VITE_API_BASE_URL`
- **Notifications**: Sonner

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Serve production build
npm run typecheck    # react-router typegen + tsc
```

## Project Structure

```
app/
├── routes/                     # Route files (config in routes.ts)
│   ├── live-match.tsx          # Public index page
│   ├── live-match.$sport.tsx   # Dynamic sport page
│   ├── hafalan.tsx             # Public hafalan/surah picker
│   ├── login.tsx
│   ├── logout.tsx
│   └── authenticated/          # Protected routes (require auth)
│       ├── layout.tsx          # Auth guard + layout wrapper
│       ├── dashboard.tsx
│       ├── tournament.tsx
│       ├── tournament-detail.tsx
│       ├── sport-detail.tsx
│       ├── admin-sport-detail.tsx
│       └── management-user.tsx
├── lib/
│   ├── services/               # API call functions grouped by resource
│   │   ├── apiClient.ts        # authenticatedFetch() helper
│   │   ├── auth/
│   │   ├── sports/
│   │   ├── tournaments/
│   │   ├── teams/
│   │   ├── matches/
│   │   └── user(s)/
│   ├── components/
│   │   ├── ui/                 # Primitive components (button, input, dialog…)
│   │   ├── layouts/            # Header, sidebar
│   │   └── {feature}/         # Feature-specific dialogs/forms
│   ├── pages/                  # Page-level containers
│   ├── stores/                 # Jotai atoms
│   ├── firebase/               # Firebase init
│   └── utils.ts                # cn() class merge helper
├── types/                      # Shared TypeScript types
├── sessions.server.ts          # Cookie session storage
└── routes.ts                   # Route config (programmatic, not file-based)
```

## Routing

Routes are defined programmatically in `routes.ts`, not auto-discovered. **Always register new routes there.**

- Public routes: `/`, `/live-match/:sport`, `/hafalan`, `/login`, `/logout`
- Protected routes: everything under `/dashboard/*` via `authenticated/layout.tsx`

## Data Fetching Pattern

- Use `clientLoader` for public pages (runs in browser, can access `import.meta.env`)
- Use `loader` (server-side) only when reading from sessions/cookies is needed
- Use `clientAction` for form submissions

```ts
// Public page
export async function clientLoader() { ... }

// Needs session/cookie
export async function loader({ request }: { request: Request }) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  ...
}
```

## API Services

Services live in `app/lib/services/{resource}/` and follow this pattern:

- **Naming**: `verbNoun.ts` → e.g. `getAllSports.ts`, `createTournament.ts`, `updateMatch.ts`
- **Authenticated calls**: use `authenticatedFetch({ token, path, options })`
- **Public calls**: use plain `fetch(\`${BASE_URL}public/...\`)`
- **Response type**: always `ApiResponse<T>`

```ts
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error_code: string;
  message: string;
};
```

Interface types for API responses are named `IResponseData{Resource}` and exported from the service file.

## Auth & Sessions

- **Cookie session** (`__session`) stores `accessToken` server-side via `sessions.server.ts`
- **localStorage** also stores `accessToken` for client loaders
- Login hits `POST {BASE_URL}auth/login` → saves token in both places
- Protected layout (`authenticated/layout.tsx`) checks token and fetches user info; redirects to `/login` if missing

## Environment Variables

All `VITE_` prefixed, accessed via `import.meta.env.VITE_*`:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | REST API base URL |
| `VITE_FIREBASE_API_KEY` | Firebase credentials |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase credentials |
| `VITE_FIREBASE_DATABASE_URL` | Firebase Realtime DB |
| `VITE_FIREBASE_PROJECT_ID` | Firebase credentials |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase credentials |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase credentials |
| `VITE_FIREBASE_APP_ID` | Firebase credentials |

## Conventions

- Path alias `~` maps to `app/` (e.g. `~/lib/components/ui/button`)
- File names: kebab-case for routes and service files
- Component names: PascalCase
- Use `cn()` from `~/lib/utils` for conditional Tailwind classes
- Avoid `loader` on pages that don't need server-side session access — prefer `clientLoader`
