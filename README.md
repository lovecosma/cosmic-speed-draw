# Cosmic Speed Draw

A web app for creating and saving drawings. Built with Rails 8 + React 19.

## Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| API             | Rails 8.0, Ruby 3.4                    |
| Frontend        | React 19, Vite, Tailwind CSS v4        |
| Database        | PostgreSQL                             |
| Auth            | Devise + devise-jwt (HttpOnly cookies) |
| Background jobs | SolidQueue                             |
| Cache           | SolidCache                             |
| WebSockets      | SolidCable                             |
| Deployment      | Heroku                                 |

## Getting started

### Prerequisites

- Ruby 3.4
- Node 22
- PostgreSQL

### Setup

```bash
# Install dependencies
bundle install
npm install --prefix app/client

# Copy and fill in environment variables
cp .env.example .env   # edit DEVISE_JWT_SECRET_KEY and DATABASE_URL

# Create and migrate the database
bin/rails db:setup

# Start Rails + Vite together
bin/dev
```

The app is at `http://localhost:3000`. The Vite dev server runs on `http://localhost:5173` and is proxied automatically.

### Environment variables

| Variable                | Required   | Notes                                                      |
| ----------------------- | ---------- | ---------------------------------------------------------- |
| `DATABASE_URL`          | Production | Set automatically by Heroku Postgres                       |
| `DEVISE_JWT_SECRET_KEY` | All        | 128-char hex secret — generate with `openssl rand -hex 64` |
| `CORS_ORIGIN`           | All        | Allowed origin; defaults to `http://localhost:5173` in dev |
| `RAILS_MASTER_KEY`      | Production | Decrypts `config/credentials.yml.enc`                      |

Copy values into `.env` for local development (loaded by foreman via `bin/dev`). The `.env` file is gitignored.

## Development

```bash
bin/dev                  # Start Rails + Vite (recommended)
bin/rails server         # Rails only (requires .env loaded separately)
bin/rails db:migrate     # Run migrations
```

## Testing

```bash
# Ruby — RSpec
bundle exec rspec                              # All specs
bundle exec rspec spec/models/user_spec.rb     # Single file
bundle exec rspec spec/models/user_spec.rb:12  # Single example

# JavaScript — Vitest
npm test --prefix app/client                   # Run once
npm run test:watch --prefix app/client         # Watch mode

# E2E — Playwright
npm run e2e                                    # Builds frontend, starts test server, runs all specs
npm run e2e:headed                             # Headed mode (visible browser)
```

## Code quality

```bash
bin/rubocop              # Lint Ruby
bin/rubocop -a           # Auto-fix
bin/brakeman --no-pager  # Security scan
npm run lint --prefix app/client   # Lint JavaScript
```

## Architecture

Rails 8 API-only (`config.api_only = true`) with an embedded Vite/React frontend at `app/client/`.

In development, `FallbackController` proxies all non-API routes to the Vite dev server. In production it serves the pre-built `public/index.html`. All API routes must be under `/api`.

### Authentication

Devise + devise-jwt with a dual-token system: a short-lived JWT (15 min) and a long-lived refresh token (30 days). `JwtCookieMiddleware` transparently moves tokens between `Authorization` headers and HttpOnly cookies — clients never handle tokens directly.

Users who haven't signed up get a provisional session automatically, so the app is usable immediately. Provisional accounts are upgraded to real accounts on sign-up or sign-in, with drawings migrated across.

### Drawings

Canvas-based drawings are autosaved every 2 seconds after the last stroke. Data is stored as a base64 PNG data URL in a PostgreSQL jsonb column. Both real users and provisional users can create and save drawings.

### Deployment

Heroku with Node.js + Ruby buildpacks (in that order). The Node.js buildpack runs `npm run build` at the root which builds the Vite frontend and copies `app/client/dist/` → `public/`. The `release` dyno runs `bin/rails db:prepare`. A separate `worker` dyno runs SolidQueue.

CI runs brakeman, rubocop, and rspec in parallel via GitHub Actions. `DEVISE_JWT_SECRET_KEY` must be set as a GitHub repository secret.
