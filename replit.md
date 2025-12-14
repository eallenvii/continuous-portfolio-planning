# Continuous Portfolio Planning

## Overview

Portfolio planning app bridging Agile story points with T-shirt sizing. Features multi-increment planning, automatic epic rollover, and capacity visualization.

## User Preferences
- Simple, everyday language
- Focus on practical workflows

## Architecture

### Frontend
- React 18 + TypeScript + Vite
- Wouter routing, TanStack React Query
- shadcn/ui + Tailwind CSS

### Backend (Python)
- **FastAPI** on port 8000
- **SQLAlchemy** ORM
- **Pydantic** validation
- Proxied through Node.js on port 5000

### Database
- PostgreSQL via Neon serverless
- Schema in `shared/schema.ts` (frontend types)
- Models in `server_python/models.py`

## Key Files

```
server_python/
├── main.py          # FastAPI endpoints
├── models.py        # SQLAlchemy models
├── schemas.py       # Pydantic schemas
└── database.py      # DB connection

client/src/
├── pages/dashboard.tsx
├── components/agile/
│   ├── ForecastPlanner.tsx
│   ├── EpicManagement.tsx
│   └── TeamProfileSettings.tsx
└── lib/api.ts

run_backend.py       # Python entry point
start.sh             # Run both servers
```

## Running

```bash
bash start.sh
```
- Python backend: port 8000
- Frontend + proxy: port 5000

## API Endpoints

- `GET/POST /api/teams`
- `GET/PATCH/DELETE /api/teams/:id`
- `GET/PUT /api/teams/:teamId/size-mappings`
- `GET/POST /api/teams/:teamId/epics`
- `PATCH/DELETE /api/epics/:id`
- `PUT /api/teams/:teamId/epics/reorder`
- `POST /api/reset-demo`

## Data Models

### Teams
- engineerCount, avgPointsPerEngineer, sprintLengthWeeks, sprintsInIncrement
- Capacity = engineerCount × avgPointsPerEngineer × sprintsInIncrement

### Epics
- title, description, originalSize, currentSize
- status: backlog | in-progress | completed
- source: Jira | Trello | Template
- priority (ordering)

## Testing

### Backend (pytest)
- Run: `python -m pytest tests/ -v`
- Tests: test_teams.py, test_jira_integration.py, test_jira_service.py, test_trello_integration.py
- Uses SQLite in-memory for fast isolated tests

### Frontend (Vitest)
- Run: `npx vitest run`
- Tests: button.test.tsx, api.test.ts, jira.test.ts
- Test utils in client/src/test/

### TDD Workflow
- Write failing tests first, implement, run until green

## Integrations (Code-Based)

### Jira (Cloud + Data Center)
- Service: server_python/jira_service.py
- Supports Cloud (email + API token) and Data Center (PAT or basic auth)
- Secrets: JIRA_BASE_URL, JIRA_DEPLOYMENT_TYPE, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PAT
- Endpoints: /api/teams/:id/jira/config, /projects, /issues, /import, /map-points

### Trello
- Service: server_python/trello_service.py
- Secrets: TRELLO_API_KEY, TRELLO_TOKEN
- Endpoints: /api/teams/:id/trello/config, /boards, /lists, /import

## Recent Changes

### December 2024
- Migrated backend from TypeScript to Python (FastAPI)
- Multi-increment planning view with epic rollover
- Configurable planning window labels
- Added pytest + Vitest test frameworks
- Implemented Jira integration (Cloud + Data Center)
- Implemented Trello integration
