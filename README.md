# Steam Tracker

A full-stack web app for browsing your Steam library, tracking achievements, and managing a personal backlog/completed list — built as a portfolio project.

Live demo: `https://steam-tracker-three.vercel.app/`

## Features

- **Dashboard** — profile overview, key stats (owned games, completed, backlog, hours played), recently played games, and quick previews of your backlog/completed lists
- **Library** — full searchable, sortable, paginated view of your owned games, with per-page lazy-loaded achievement data
- **Backlog / Completed** — dedicated filtered views of the library, backed by the same component with URL-synced filters and pagination
- **Game details** — playtime stats, achievement progress, and a full list of achievements (locked/unlocked) with pagination
- **Steam login** — sign in with your own Steam account via OpenID; falls back to a demo profile when logged out
- **Persistent backlog/completed status** — stored per-account in the browser (`localStorage`)
- **Responsive, dark-themed UI** built with Angular signals and Bootstrap

## Tech Stack

### Frontend

- **Angular** (standalone components, signals, the `@angular/build:application` builder)
- **Bootstrap 5** + **Bootstrap Icons** for layout and iconography
- RxJS interop (`toSignal`) for bridging router/HTTP observables into signals

### Backend

- **Node.js** + **Express**
- **Axios** for calls to the Steam Web API and Steam Store API
- **node-steam-openid** for "Sign in through Steam" (OpenID 2.0)
- **JWT** (in an HTTP-only cookie) for session persistence after login
- **cookie-parser**, **cors**

### Deployment

- Hosted as a single **Vercel** project using Vercel's **Services** feature — the Angular build (static) and the Express app (as a service with its own entrypoint) are deployed together under one domain, with `vercel.json` rewrites routing `/api/*` and `/auth/*` to the backend and everything else to the frontend. This avoids any cross-origin cookie issues since both are served from the same origin in production.

## Project Structure

```
steam-tracker/
├── backend/
│   ├── app.js              # Express app (exported, no listen()) — used by Vercel Services
│   ├── server.js           # Local dev entrypoint (calls app.listen())
│   ├── config/
│   │   └── steam-auth.js   # node-steam-openid configuration
│   ├── routes/
│   │   ├── steam.js        # /api/steam/* — profile, games, achievements, store data
│   │   └── auth-router.js  # /auth/* — Steam login, callback, session check, logout
│   └── services/
│       └── steam-service.js # Steam Web API / Store API integration
├── src/
│   ├── app/
│   │   ├── core/services/  # SteamService (HTTP), SteamStateService (app state)
│   │   ├── features/       # dashboard, library, game-details (routed pages)
│   │   ├── shared/         # navbar, footer, game-card, stat-card
│   │   └── models/         # TypeScript interfaces for API data
│   └── environments/       # environment.ts (prod), environment.development.ts
└── vercel.json              # Multi-service deployment config
```

## Steam API Integration

The backend wraps the Steam Web API and Steam Store API so the frontend never talks to Steam directly:

| Endpoint                                      | Purpose                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `GET /api/steam/profile/:steamId`             | Player summary + Steam level                                                    |
| `GET /api/steam/games/:steamId`               | Full owned games list                                                           |
| `GET /api/steam/recently-played/:steamId`     | Last 2 weeks' activity (capped at 3 games)                                      |
| `GET /api/steam/achievements/:steamId/:appId` | Per-game achievement progress, rarest achievements, and full achievement list   |
| `GET /api/steam/store/:appId`                 | Store metadata (name, header image, description) — cached in-memory per `appId` |
| `GET /auth/steam`                             | Starts the Steam OpenID login redirect                                          |
| `GET /auth/steam/return`                      | OpenID callback — verifies the login and issues a JWT cookie                    |
| `GET /auth/me`                                | Returns the currently logged-in `steamId`, if any                               |
| `POST /auth/logout`                           | Clears the auth cookie                                                          |

Achievement data for the full library is loaded lazily — only for games visible on the current page — to avoid excessive calls to Steam's per-game achievement endpoint (there's no bulk endpoint for a user's whole library).

## Local Development

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
STEAM_API_KEY=your_steam_web_api_key
JWT_SECRET=a_long_random_string
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:3000
```

```bash
npm run dev
```

Runs on `http://localhost:3000`.

### Frontend

```bash
npm install
ng serve
```

Runs on `http://localhost:4200`, using `environment.development.ts` to point at the local backend.

## Notes

- **Family Sharing games**: Steam's `GetOwnedGames` endpoint only returns games you have a license for — games played via Family Sharing can appear in "recently played" but not in the owned-games list. The app merges both lists where needed so these games still display correctly.
- **Fallback images**: game card/hero images try several Steam CDN paths in sequence (custom capsule → header → generic capsule) before falling back to a styled placeholder, since not every game has every image asset.
- **Steam branding**: the "Sign in through Steam" button uses Steam's official button asset per their branding guidelines; the footer includes the required Valve trademark attribution.
