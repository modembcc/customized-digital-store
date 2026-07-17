# customized-digital-store

A customizable e-commerce platform with admin dashboard, built test-first from business requirements (BDD/ATDD).

## Stack

- **Backend**: Node.js, Express, Mongoose (MongoDB) — `server/`
- **Frontend**: React, Vite, React Router — `client/`
- **Testing**: Jest + Supertest + `mongodb-memory-server` (backend), Vitest + React Testing Library (frontend)

This is a barebone scaffold: a public product listing, a product detail page, and admin
pages to list/create/edit/delete products. There is no auth system yet — admin routes are
open behind a placeholder middleware (`server/src/middleware/requireAdmin.js`) meant to be
replaced once requirements for authentication/authorization are written as tests.

## Getting started

```bash
npm install       # installs both server and client workspaces
```

### Database

No real MongoDB connection is required to run the tests — the backend test suite spins up
an in-memory MongoDB instance automatically via `mongodb-memory-server`.

To run the app itself against a real database, copy `server/.env.example` to `server/.env`
and set `MONGODB_URI` to your own connection string (a local `mongod`, Atlas, etc.). Then
optionally seed it with the mock products:

```bash
npm run seed --workspace server
```

### Running the app

```bash
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173 (proxies /api to the server)
```

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
    models/Product.js      # Product schema/validation
    data/mockProducts.js   # seed data
    controllers/           # request handlers
    routes/                 # /api/products (public), /api/admin/products (admin)
    middleware/             # asyncHandler, errorHandler, requireAdmin placeholder
  tests/
    unit/                   # model validation, controllers with mocked Product model
    integration/            # full HTTP requests against an in-memory MongoDB

client/
  src/
    pages/                  # Home, ProductDetail, admin/*
    components/             # ProductCard, Header
    services/api.js         # fetch wrappers for the backend API
    test/setup.js            # jest-dom matchers for Vitest
  (co-located *.test.jsx files next to the components/pages they cover)
```

## Suggested next steps for TDD

Each business requirement should start as a failing test in `server/tests/` and/or
`client/src/**/*.test.jsx` before implementation. Natural next slices for this store:

- Authentication/authorization (replace `requireAdmin` with real checks)
- Cart and checkout flow
- Order model and order history
- Product search/filtering by category
- Image upload for products (currently placeholder image URLs)
