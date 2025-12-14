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
- **Node.js** with Express
- **TypeScript** with ESM modules
- RESTful JSON API under `/api` prefix

### Database
- **PostgreSQL** via Neon serverless
- **Drizzle ORM** with Zod schema validation
- Shared schema between frontend and backend

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use Neon serverless)

### Environment Variables
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Push database schema:
```bash
npm run db:push
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── client/
│   └── src/
│       ├── components/
│       │   ├── agile/
│       │   │   ├── EpicManagement.tsx    # Create/import epics dialog
│       │   │   ├── ForecastPlanner.tsx   # Multi-window planning view
│       │   │   └── TeamProfileSettings.tsx
│       │   ├── ui/                        # shadcn/ui components
│       │   └── LandingPage.tsx
│       ├── hooks/
│       │   └── use-toast.ts
│       ├── lib/
│       │   ├── api.ts                     # API client functions
│       │   ├── mockData.ts                # Type definitions
│       │   └── utils.ts
│       ├── pages/
│       │   └── dashboard.tsx              # Main application page
│       ├── App.tsx
│       └── main.tsx
├── server/
│   ├── db.ts                              # Database connection (Neon + ws)
│   ├── index.ts                           # Production entry point
│   ├── index-dev.ts                       # Development entry point
│   ├── routes.ts                          # API route definitions
│   ├── storage.ts                         # Database access layer
│   └── vite.ts                            # Vite dev middleware
├── shared/
│   └── schema.ts                          # Drizzle schema + Zod types
├── drizzle.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## API Endpoints

### Teams
- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create new team
- `PATCH /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Size Mappings
- `GET /api/teams/:teamId/size-mappings` - Get size mappings for team
- `PUT /api/teams/:teamId/size-mappings` - Replace all size mappings for team

### Epics
- `GET /api/teams/:teamId/epics` - Get epics for team
- `POST /api/teams/:teamId/epics` - Create epic
- `PATCH /api/epics/:id` - Update epic
- `DELETE /api/epics/:id` - Delete epic
- `PUT /api/teams/:teamId/epics/reorder` - Reorder epics

### Demo
- `POST /api/reset-demo` - Reset to demo data

## Data Models

### Team
- `id`: Primary key
- `name`: Team name
- `avatar`: Avatar URL
- `engineerCount`: Number of engineers
- `avgPointsPerEngineer`: Average points per engineer per sprint
- `sprintLengthWeeks`: Sprint duration in weeks
- `sprintsInIncrement`: Number of sprints per planning increment

### Size Mapping
- `id`: Primary key
- `teamId`: Foreign key to team
- `size`: T-shirt size (2-XS, XS, S, M, L, XL, 2-XL, 3-XL)
- `points`: Story points for this size
- `confidence`: Confidence percentage (0-100)
- `anchorDescription`: Description for calibration

### Epic
- `id`: Primary key
- `teamId`: Foreign key to team
- `title`: Epic title
- `description`: Epic description
- `originalSize`: Initial T-shirt size
- `currentSize`: Current T-shirt size (may differ from original)
- `status`: backlog | in-progress | completed
- `source`: Jira | Trello | Template
- `priority`: Sort order
- `externalId`: Optional external system ID

## Capacity Calculation

```
Sprint Capacity = Engineer Count × Avg Points Per Engineer
Increment Capacity = Sprint Capacity × Sprints In Increment
```

Default values:
- Engineers: 5
- Points per engineer: 8
- Sprint length: 2 weeks
- Sprints per increment: 6

Default increment capacity: 5 × 8 × 6 = 240 points

## CSV Import Format

For importing epics from CSV:

```csv
title,description,size,source
"Epic Title","Epic description","M","Jira"
"Another Epic","Description here","L","Trello"
```

Supported sizes: 2-XS, XS, S, M, L, XL, 2-XL, 3-XL
Supported sources: Jira, Trello, Template

## Development

### Database Schema Changes

After modifying `shared/schema.ts`:
```bash
npm run db:push
```

### Type Safety

The application uses shared types between frontend and backend via the `shared/` directory. Drizzle schemas automatically generate Zod validation schemas and TypeScript types.

## License

MIT
