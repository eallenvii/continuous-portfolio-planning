# Continuous Portfolio Planning

## Overview

A Continuous Portfolio Planning application that bridges Agile teams using story points with Portfolio Management using T-shirt sizes. Enables capacity forecasting, multi-increment epic planning, and "above/below the line" visualization for quarterly planning.

**Current Features:**
- Team profile management with capacity calculations
- T-shirt size to story point mappings with confidence percentages
- Epic management (create, import CSV, delete, drag-and-drop reorder)
- Multi-increment forecast view with automatic epic rollover
- Configurable planning window labels (Q3 2024, Q4 2024, etc.)

## User Preferences

- Preferred communication style: Simple, everyday language
- Focus on practical portfolio planning workflows

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight)
- **State**: TanStack React Query for server state
- **UI**: shadcn/ui on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **Build**: Vite

### Backend
- **Runtime**: Node.js + Express
- **Language**: TypeScript ESM
- **API**: RESTful JSON under `/api`
- **Dev**: Vite middleware for HMR
- **Prod**: Static file serving

### Database
- **PostgreSQL** via Neon serverless (requires ws for WebSocket)
- **ORM**: Drizzle with Zod validation
- **Schema**: `shared/schema.ts`
- **Migrations**: `npm run db:push`

## Key Files

```
client/src/
├── pages/dashboard.tsx              # Main app with React Query
├── components/agile/
│   ├── ForecastPlanner.tsx          # Multi-window planning view
│   ├── EpicManagement.tsx           # Add/import epics dialog
│   └── TeamProfileSettings.tsx      # Team config
├── lib/api.ts                       # API client

server/
├── routes.ts                        # REST endpoints
├── storage.ts                       # Database operations
├── db.ts                            # Neon connection with ws

shared/schema.ts                     # Drizzle schemas + types
```

## Data Models

### Teams
- engineerCount, avgPointsPerEngineer, sprintLengthWeeks, sprintsInIncrement
- Capacity = engineerCount × avgPointsPerEngineer × sprintsInIncrement

### Size Mappings
- T-shirt sizes: 2-XS, XS, S, M, L, XL, 2-XL, 3-XL
- Each maps to story points with confidence %

### Epics
- title, description, originalSize, currentSize
- status: backlog | in-progress | completed
- source: Jira | Trello | Template
- priority (for ordering)

## Recent Changes

### December 2024
- Added multi-increment planning view showing epics across future quarters
- Implemented automatic epic rollover when capacity exceeded
- Added configurable planning window labels with quarter/year selection
- Adjustable number of planning windows (1-6)

## Workflows

### Start Application
```bash
npm run dev
```
Runs on port 5000 with Vite HMR.

### Database
```bash
npm run db:push   # Push schema changes
```

## API Endpoints

- `GET/POST /api/teams` - Team CRUD
- `GET/PATCH/DELETE /api/teams/:id`
- `GET/PUT /api/teams/:teamId/size-mappings`
- `GET/POST /api/teams/:teamId/epics`
- `PATCH/DELETE /api/epics/:id`
- `PUT /api/teams/:teamId/epics/reorder`
- `POST /api/reset-demo` - Reset to demo data

## Technical Notes

- Neon requires `ws` package for WebSocket connections (configured in server/db.ts)
- Frontend uses @shared alias for shared types
- Capacity "cut line" shows where capacity is exceeded
- Epics beyond capacity automatically flow to next planning window
