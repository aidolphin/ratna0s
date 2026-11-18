# Backend Architecture (Multi-tenant RatnaOS)

## Stack
- Node.js + Fastify/Express, PostgreSQL, Redis, S3-compatible storage.
- JWT auth + refresh tokens; RBAC per tenant.

## Tenancy
- Each shop = tenant with isolated schema or row-level security (tenant_id).
- Users belong to tenant; roles: owner, accountant, CA, auditor, etc.

## Data
- Migrate local storage state to relational tables: accounts, journals, lines, vouchers, tax rules, periods, calendar.
- Decimal money stored as integer minor units (paisa).

## Backups
- Daily automated DB backups + point-in-time recovery.
- Tenant export (JSON/CSV) on demand.

## Security
- HTTPS only, rate limiting, audit log append-only, period locks.

## Deployment
- Docker + managed Postgres; env-based config; CI/CD.
