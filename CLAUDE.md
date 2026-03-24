# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bin/rails server          # Start dev server
bin/rails console         # Rails console
bin/rails db:migrate      # Run migrations
bin/rails db:test:prepare # Prepare test database

# Testing
bin/rails test                          # Run all tests
bin/rails test test/models/foo_test.rb  # Run a single test file
bin/rails test test/models/foo_test.rb:42  # Run a single test by line

# Code quality
bin/rubocop            # Lint (rubocop-rails-omakase style)
bin/rubocop -a         # Auto-fix offenses
bin/brakeman --no-pager  # Security scan
```

## Architecture

**Rails 8.0 API-only application** (`config.api_only = true`). No views or HTML rendering — controllers return JSON.

### Infrastructure
Rails 8 solid gems back all persistent infrastructure via PostgreSQL (no Redis needed):
- **SolidQueue** — Active Job backend (production), configured in `config/environments/production.rb`
- **SolidCache** — Rails cache store (production)
- **SolidCable** — Action Cable backend

These use separate databases (`cosmic_speed_draw_queue`, `cosmic_speed_draw_cache`, `cosmic_speed_draw_cable`) with their own schema files in `db/` (`queue_schema.rb`, `cache_schema.rb`, `cable_schema.rb`) and separate migration paths.

### Database
PostgreSQL. Main app schema is in `db/schema.rb` (managed by `db:migrate`). The solid gem schemas are separate and not touched by standard migrations.

### Deployment
Docker + Kamal. Production container runs Puma behind Thruster (HTTP asset caching/compression proxy). See `Dockerfile` and `.kamal/`.

### CI
GitHub Actions (`.github/workflows/ci.yml`) runs three jobs in parallel: `scan_ruby` (brakeman), `lint` (rubocop), and `test` (minitest against a real PostgreSQL service).

### Testing
Minitest with parallel execution across processors. Tests hit a real database — no mocking of the DB layer.
