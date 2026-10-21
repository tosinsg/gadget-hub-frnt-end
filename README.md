# GadgetHub — frontend

React 19 · Vite 8 · Tailwind 4 · React Router 7 · axios · framer-motion

The storefront, buyer account pages, seller dashboard and admin dashboard. It talks to the Spring
Boot API over HTTP and subscribes to its live event stream. **The browser never connects to MongoDB.**

> This README replaces one that described a PostgreSQL schema, `db/gadgethub.sql`, and a demo-data
> fallback. None of those exist here — the frontend has no database of its own and never invents
> inventory or orders.

## Run

```powershell
npm ci
Copy-Item .env.example .env     # optional; the default already points at the local API
npm run dev                     # http://localhost:5173
npm run build                   # production build
npm run lint
```

The backend must be running at `http://localhost:8080/api` (see `../../backend/gadgethub`).

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | REST base URL |
| `VITE_POLL_INTERVAL_MS` | `15000` | fallback refresh interval when the live stream is unavailable |

Vite inlines `VITE_*` at **build** time, so changing either requires a dev-server restart.

`LIVE_URL` and `LOW_STOCK_THRESHOLD` are derived in `src/config.js`.

## How it is laid out

```
src/
  api/          one module per resource; every call goes through http.js
  components/   layout (Navbar, Footer, LiveBadge, RequireRole), product, auth, dashboard
  context/      AuthContext, CartContext, LiveContext
  hooks/        useApiData — loading/error/reload for any async fetch
  pages/        Home, Products, shop/, auth/, seller/, admin/
  utils/        format.js, validation.js
```

### Where the rules live

`src/utils/validation.js` **mirrors** the server's `Rules.java`. It exists for fast feedback — telling
someone what is wrong without a round trip.

It is **not** a security control. Anyone can edit the JavaScript or post directly to the API with
`curl`. The server validates everything independently, and when the two disagree the server wins. The
two files are kept identical on purpose so the browser never accepts something the server will reject.

### Live updates

`LiveContext` opens an `EventSource` to `/api/live/stream` and hands events to any component that
subscribes:

```jsx
useLiveEvent("product.updated", (event) => setStock(event.stock));
```

If the stream cannot connect — a proxy that kills long-lived connections, an old browser — the
provider automatically falls back to polling and the UI shows *Refreshing periodically* instead of
*Live*. It never silently pretends to be current.

### Session handling

The token lives in `localStorage` (see the note about cookies in the project guide). Two things make
this safer than it sounds:

- the stored user object is only a cache for rendering; **every protected action is authorised by the
  server** from the token
- `AuthContext` re-checks the session against `GET /auth/me` on load, and the HTTP layer clears the
  whole session the moment the server answers 401 — so a token whose permissions were revoked stops
  working rather than leaving the UI half-logged-in

### Route guards

`RequireRole` wraps `/seller/dashboard` and `/admin`. It is a convenience that keeps a buyer out of a
page that would only show errors. It protects nothing: the server independently authorises every
`/api/seller` and `/api/admin` request.

## Verification

```
npx eslint src   →  0 problems
npm run build    →  succeeds
```

## Known limitations

- No review system — the UI shows real `unitsSold`, not invented star ratings.
- No payment step; checkout is pay-on-delivery.
- No charting or historical analytics on the dashboards.

The full list is in `../../GADGETHUB_PROJECT_GUIDE.md` (section 10).
"# gadget-hub-frnt-end" 
