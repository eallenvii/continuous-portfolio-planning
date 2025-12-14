# Continuous Portfolio Planning

A modern web application that bridges the gap between Agile teams using story points and Portfolio Management using T-shirt sizes. Plan epics across multiple planning increments, visualize capacity constraints, and manage "above/below the line" commitments for quarterly planning.

## Features

### Team Profile Management
- Configure team size (number of engineers)
- Set average story points per engineer per sprint
- Define sprint length and number of sprints per planning increment
- Automatic capacity calculation based on team configuration

### T-Shirt Size Mappings
- Translate T-shirt sizes (2-XS through 3-XL) to story points
- Confidence percentages for each size estimate
- Anchor descriptions to standardize sizing across the team

### Epic Management
- Create epics manually or import via CSV
- Drag-and-drop prioritization
- Inline size editing with visual modification indicators
- Delete epics with confirmation
- Source tracking (Jira, Trello, or Template)

### Multi-Increment Forecast Planning
- View multiple planning windows side-by-side (Q3, Q4, Q1, etc.)
- Automatic epic rollover when capacity is exceeded
- Visual capacity indicators per increment
- Configurable planning window labels and count
- "Cut line" visualization showing capacity boundaries

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack React Query** for server state management
- **shadcn/ui** component library (built on Radix UI)
- **Tailwind CSS** for styling
- **Vite** for development and building

### Backend
- **Python 3.11** with FastAPI
- **SQLAlchemy** ORM
- **Pydantic** for validation
- RESTful JSON API under `/api` prefix

### Database
- **PostgreSQL** (Neon serverless)
- Shared schema between frontend and backend

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL database

### Environment Variables
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Install Python dependencies:
```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-dotenv
```

3. Start the application:
```bash
bash start.sh
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
├── client/
│   └── src/
│       ├── components/
│       │   ├── agile/
│       │   │   ├── EpicManagement.tsx
│       │   │   ├── ForecastPlanner.tsx
│       │   │   └── TeamProfileSettings.tsx
│       │   └── ui/
│       ├── lib/
│       │   └── api.ts
│       └── pages/
│           └── dashboard.tsx
├── server_python/
│   ├── main.py              # FastAPI application
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   └── database.py          # Database connection
├── server/
│   └── routes.ts            # Proxy to Python backend
├── shared/
│   └── schema.ts            # Drizzle schemas (frontend types)
├── run_backend.py           # Python entry point
└── start.sh                 # Start both servers
```

## API Endpoints

### Teams
- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create new team
- `PATCH /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Size Mappings
- `GET /api/teams/:teamId/size-mappings` - Get size mappings
- `PUT /api/teams/:teamId/size-mappings` - Replace all size mappings

### Epics
- `GET /api/teams/:teamId/epics` - Get epics
- `POST /api/teams/:teamId/epics` - Create epic
- `PATCH /api/epics/:id` - Update epic
- `DELETE /api/epics/:id` - Delete epic
- `PUT /api/teams/:teamId/epics/reorder` - Reorder epics

### Demo
- `POST /api/reset-demo` - Reset to demo data

## Data Models

### Team
- `id`, `name`, `avatar`
- `engineer_count`, `avg_points_per_engineer`
- `sprint_length_weeks`, `sprints_in_increment`

### Size Mapping
- `size`: T-shirt size (2-XS to 3-XL)
- `points`: Story points
- `confidence`: Confidence percentage
- `anchor_description`: Calibration description

### Epic
- `title`, `description`
- `original_size`, `current_size`
- `status`: backlog | in-progress | completed
- `source`: Jira | Trello | Template
- `priority`: Sort order

## Capacity Calculation

```
Increment Capacity = Engineer Count × Avg Points Per Engineer × Sprints In Increment
```

## License

MIT License - Copyright (c) 2024 IdeaCanvas

See [LICENSE](LICENSE) for details.
