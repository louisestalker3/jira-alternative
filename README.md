# Jira Alternative

> The simpler, faster alternative to Jira — built for indie devs and small teams.

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

Then open [http://localhost](http://localhost).

The API is available at [http://localhost:8000](http://localhost:8000) with auto-docs at `/docs`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.12) + SQLAlchemy async |
| Database | PostgreSQL 16 |
| Auth | JWT (email + password) |
| Payments | Stripe Checkout + Billing Portal |
| Deployment | Docker Compose |

## Architecture

```
.
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, routers
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── database.py      # Async SQLAlchemy engine + session
│   │   ├── deps.py          # Auth dependency (JWT → User)
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   └── routers/         # Route handlers (auth, projects, issues, …)
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Routes
│   │   ├── contexts/        # AuthContext
│   │   ├── lib/api.ts       # Axios API client + all type definitions
│   │   ├── pages/           # Full pages (Landing, Auth, Dashboard, …)
│   │   └── components/      # Shared components (Layout, Kanban, IssueCard, …)
│   ├── Dockerfile
│   └── nginx.conf           # Nginx SPA + API proxy
├── docker-compose.yml
└── .env.example
```

## Features

- **Kanban board** with drag-and-drop (dnd-kit) across Backlog / To Do / In Progress / In Review / Done
- **Issue detail page** with inline editing, status/priority/type selectors, and threaded comments
- **Onboarding flow** — create project + first issue in under 5 minutes
- **Flat-rate billing** — Free (1 project, 10 issues) or Pro ($9/mo, unlimited) via Stripe
- **JWT auth** — register, login, 24-hour tokens

## API routes

```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/users/me
PATCH /api/v1/users/me

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{id}
PATCH  /api/v1/projects/{id}
DELETE /api/v1/projects/{id}

GET    /api/v1/projects/{id}/issues
POST   /api/v1/projects/{id}/issues
GET    /api/v1/projects/{id}/issues/{issue_id}
PATCH  /api/v1/projects/{id}/issues/{issue_id}
DELETE /api/v1/projects/{id}/issues/{issue_id}

GET    /api/v1/projects/{id}/issues/{issue_id}/comments
POST   /api/v1/projects/{id}/issues/{issue_id}/comments
PATCH  /api/v1/projects/{id}/issues/{issue_id}/comments/{comment_id}
DELETE /api/v1/projects/{id}/issues/{issue_id}/comments/{comment_id}

POST /api/v1/billing/checkout
POST /api/v1/billing/portal
POST /api/v1/billing/webhook
```

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_USER` | yes | DB username (default: `jira_alt`) |
| `POSTGRES_PASSWORD` | yes | DB password |
| `POSTGRES_DB` | yes | DB name |
| `SECRET_KEY` | yes | JWT signing key (min 32 chars) |
| `STRIPE_SECRET_KEY` | optional | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | optional | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | optional | Stripe price ID for Pro plan |
| `FRONTEND_URL` | yes | Full URL of the frontend (for Stripe redirects) |

Billing works without Stripe configured — the upgrade button just returns a 503.

## Stripe setup

1. Create a product and monthly price in the Stripe dashboard
2. Copy the price ID (`price_...`) to `STRIPE_PRO_PRICE_ID`
3. Set up a webhook endpoint: `POST https://yourdomain.com/api/v1/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Deploying to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

Set all env vars in the Railway dashboard. The `docker-compose.yml` is Railway-compatible.

## Development (without Docker)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+asyncpg://jira_alt:password@localhost:5432/jira_alt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev  # proxies /api → localhost:8000
```

## Pricing

| | Free | Pro |
|---|---|---|
| Projects | 1 | Unlimited |
| Issues per project | 10 | Unlimited |
| Comments | Unlimited | Unlimited |
| Price | $0 / forever | $9 / month (whole team) |
