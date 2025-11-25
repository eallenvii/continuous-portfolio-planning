export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface Project {
  id: string;
  name: string;
  description: string;
  size: TShirtSize;
  estimatedPoints: number;
  assignedTeamId?: string;
  status: 'backlog' | 'planned' | 'in-progress' | 'completed';
  quarter?: string; // e.g., "Q1 2024"
}

export interface Team {
  id: string;
  name: string;
  velocity: number; // Average points per sprint
  sprintLengthWeeks: number;
  memberCount: number;
  avatar: string;
}

export interface SizeDefinition {
  size: TShirtSize;
  points: number;
  description: string;
}

export const SIZE_DEFINITIONS: SizeDefinition[] = [
  { size: 'XS', points: 5, description: 'Quick win, less than a sprint' },
  { size: 'S', points: 13, description: 'One sprint feature' },
  { size: 'M', points: 40, description: 'Multi-sprint initiative (~1 month)' },
  { size: 'L', points: 100, description: 'Quarterly goal (~3 months)' },
  { size: 'XL', points: 250, description: 'Major architectural shift (~6 months)' },
];

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Alpha Squad', velocity: 45, sprintLengthWeeks: 2, memberCount: 6, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha' },
  { id: 't2', name: 'Beta Builders', velocity: 38, sprintLengthWeeks: 2, memberCount: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beta' },
  { id: 't3', name: 'Gamma Growth', velocity: 52, sprintLengthWeeks: 2, memberCount: 7, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gamma' },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'User Authentication Overhaul', description: 'Move to passwordless auth', size: 'M', estimatedPoints: 40, assignedTeamId: 't1', status: 'planned', quarter: 'Q2 2024' },
  { id: 'p2', name: 'Mobile App Refactor', description: 'Improve performance on iOS', size: 'L', estimatedPoints: 100, assignedTeamId: 't2', status: 'in-progress', quarter: 'Q2 2024' },
  { id: 'p3', name: 'Dark Mode Implementation', description: 'System-wide dark mode support', size: 'S', estimatedPoints: 13, assignedTeamId: 't1', status: 'backlog' },
  { id: 'p4', name: 'Analytics Dashboard', description: 'New reporting tools for admins', size: 'XL', estimatedPoints: 250, status: 'backlog' },
  { id: 'p5', name: 'Payment Gateway Integration', description: 'Add Stripe support', size: 'M', estimatedPoints: 40, assignedTeamId: 't3', status: 'planned', quarter: 'Q3 2024' },
];
