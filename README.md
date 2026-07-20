# customized-digital-store

A customizable e-commerce platform with admin dashboard, built test-first from business requirements (BDD/ATDD).

## Stack

- **Backend**: Node.js, Express, Mongoose (MongoDB) — `server/`
- **Frontend**: React, Vite, React Router — `client/`
- **Testing**: Jest + Supertest + `mongodb-memory-server` (backend), Vitest + React Testing Library (frontend)

A public product listing, product detail page, client-side cart, email/password accounts,
and admin pages to list/create/edit/delete products (gated to the `admin` role).

## Getting started

```bash
npm install       # installs both server and client workspaces
```

### Database

No real MongoDB is required to run the app or the tests. The backend test suite spins up
an in-memory MongoDB instance automatically via `mongodb-memory-server`, and `npm run
dev:server` does the same as a fallback whenever `MONGODB_URI` is unset or unreachable —
it seeds itself with the mock products so the app works with zero setup. Data in that
in-memory fallback does not persist across server restarts.

Once you have a real database, copy `server/.env.example` to `server/.env` and set
`MONGODB_URI` to your own connection string (a local `mongod`, Atlas, etc.). Then
optionally seed it with the mock products:

```bash
npm run seed --workspace server
```

### Running the app

```bash
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173 (proxies /api to the server)
```

## Accounts

Signup/login/logout is email + password, hashed server-side, with the session kept in a
JWT stored as an httpOnly cookie (not readable by JS, not stored in localStorage). Every
new signup is created as a `customer` — there is no way for a client to request the
`admin` role, by design.

**Creating the first admin account**: sign up normally, then manually set that user's
`role` field to `admin` directly in MongoDB (Atlas UI, `mongosh`, etc.) — there is no
promote-endpoint. The signed-in browser session won't see the new role until that user
logs out and back in, since the role is baked into their existing JWT.

Optional env vars (see `server/.env.example`, both have safe dev fallbacks so nothing is
required to run locally): `JWT_SECRET` (falls back to an insecure dev secret with a
console warning) and `CLIENT_ORIGIN` (defaults to the Vite dev server, used for
credentialed CORS).

Signup has a `verifyCaptcha` middleware mount point (`server/src/middleware/verifyCaptcha.js`)
that's currently a no-op placeholder — no captcha provider is wired up yet.

## Product images

Admins can upload one image per product (`POST /api/admin/products/upload`, `multipart/form-data`,
field name `image`) from the product form — selecting a file uploads it immediately and shows
a preview. Images are limited to 2MB, must be an image mimetype, and only one file per request
is accepted. Uploaded files are stored on local disk under `server/uploads/` (gitignored) and
served back at `/uploads/<filename>`; this is fine for local development but won't survive a
redeploy on hosts without persistent disk (e.g. most serverless platforms) — swapping in a real
object store (S3, Cloudinary, etc.) behind the same endpoint is a natural later upgrade.

## Running tests (TDD workflow)

```bash
npm test                  # runs both server and client suites once
npm run test:server       # backend only
npm run test:client       # frontend only
npm run test:server:watch # backend, watch mode — good for red/green/refactor
npm run test:client:watch # frontend, watch mode
```

## Project layout

```
server/
  src/
    app.js               # Express app (exported factory, used directly in tests)
    server.js             # entry point: connects DB, starts the HTTP listener
    seed.js                # inserts mockProducts into the connected database
    config/db.js           # Mongoose connect/disconnect helpers
    config/auth.js         # JWT secret/expiry/cookie config (dev fallback + warning)
    models/Product.js      # Product schema/validation
    models/User.js         # User schema — email/password (hashed)/role
    data/mockProducts.js   # seed data
    controllers/           # request handlers (products, auth)
    routes/                 # /api/products (public), /api/admin/products (admin),
                             # /api/auth (signup/login/logout/me)
    middleware/             # asyncHandler, errorHandler, requireAuth, requireAdmin,
                             # verifyCaptcha placeholder, uploadImage (multer)
  uploads/                  # uploaded product images (gitignored, local disk only)
  tests/
    unit/                   # model validation, controllers with mocked models
    integration/            # full HTTP requests against an in-memory MongoDB

client/
  src/
    pages/                  # Home, ProductDetail, Cart, Login, Signup, admin/*
    components/             # ProductCard, Header, RequireAdmin (route guard)
    context/                # CartContext, AuthContext
    services/api.js         # fetch wrappers for the backend API
    test/setup.js            # jest-dom matchers for Vitest
  (co-located *.test.jsx files next to the components/pages they cover)
```

## Suggested next steps for TDD

Each business requirement should start as a failing test in `server/tests/` and/or
`client/src/**/*.test.jsx` before implementation. Natural next slices for this store:

- Checkout flow (cart already exists; no order/payment step yet)
- Order model and order history
- A real captcha provider behind the existing `verifyCaptcha` placeholder
- Password reset and email verification
- Profile editing, "remember me", rate limiting on login, refresh tokens
- A role-promotion endpoint (currently a deliberate manual-DB-edit step)
- Product search/filtering by category
- Move product image storage off local disk to a real object store for production use
