# Continuous Portfolio Planning

## Overview

This is a Continuous Portfolio Planning application that bridges the gap between Agile teams using story points and Portfolio Management using T-shirt sizes. The application enables teams to forecast capacity, plan epics across planning increments, and visualize "above/below the line" commitments for quarterly planning.

Key features include:
- Team profile management with capacity calculations
- T-shirt size to story point mappings with confidence percentages
- Epic management with drag-and-drop prioritization
- Forecast planning with visual capacity indicators
- Integration support for Jira and Trello (planned)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Development**: Hot module replacement via Vite middleware
- **Production**: Static file serving from built assets

### Data Storage
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with Zod schema validation
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `db:push` command

### Key Data Models
- **Teams**: Core entity with capacity settings (engineer count, points per engineer, sprint length)
- **Size Mappings**: T-shirt size to story point translations per team
- **Epics**: Work items with size, status, and ordering
- **Planning Snapshots**: Historical forecasts for retrospectives
- **Integration Configs**: External tool connection settings

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components (shadcn + custom)
│   ├── pages/           # Route components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and API client
├── server/              # Express backend
│   ├── routes.ts        # API endpoint definitions
│   ├── storage.ts       # Database access layer
│   └── db.ts            # Database connection
├── shared/              # Shared code
│   └── schema.ts        # Drizzle schema + Zod types
└── migrations/          # Database migrations
```

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless Postgres database
- **Connection**: Via `DATABASE_URL` environment variable
- **WebSocket**: Required for Neon's serverless driver in Node.js

### UI Libraries
- **Radix UI**: Headless component primitives (dialogs, dropdowns, tabs, etc.)
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management
- **date-fns**: Date formatting utilities

### Planned Integrations
- **Jira**: Epic synchronization (integration config stored, API not yet implemented)
- **Trello**: Board synchronization (integration config stored, API not yet implemented)

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **esbuild**: Production server bundling
- **TypeScript**: Type checking across full stack