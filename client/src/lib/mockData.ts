export type TShirtSize = '2-XS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | '2-XL' | '3-XL';

export interface SizeMapping {
  size: TShirtSize;
  points: number;
  confidence: number; // 0-100
  anchorDescription: string;
}

export interface TeamProfile {
  id: string;
  name: string;
  avatar: string;
  engineerCount: number;
  avgPointsPerEngineer: number; // per sprint
  sprintLengthWeeks: number;
  sprintsInIncrement: number; // Planning window (e.g., 6 sprints for a quarter)
  sizeMappings: SizeMapping[];
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  originalSize: TShirtSize;
  currentSize: TShirtSize;
  status: 'backlog' | 'in-progress' | 'completed';
  source: 'Jira' | 'Trello' | 'Template';
  isTemplate?: boolean;
}

export const DEFAULT_MAPPINGS: SizeMapping[] = [
  { size: '2-XS', points: 3, confidence: 95, anchorDescription: '1 FTE @ 1 week' },
  { size: 'XS', points: 8, confidence: 90, anchorDescription: '1 FTE @ 2 weeks' },
  { size: 'S', points: 20, confidence: 85, anchorDescription: '2 FTEs @ 1 sprint' },
  { size: 'M', points: 40, confidence: 80, anchorDescription: 'Full team @ 1 sprint' },
  { size: 'L', points: 100, confidence: 70, anchorDescription: 'Multi-sprint feature' },
  { size: 'XL', points: 250, confidence: 60, anchorDescription: 'Quarterly initiative' },
  { size: '2-XL', points: 500, confidence: 40, anchorDescription: 'Multi-quarter initiative' },
  { size: '3-XL', points: 1000, confidence: 20, anchorDescription: 'Yearly initiative' },
];

export const MOCK_TEAM: TeamProfile = {
  id: 'team-1',
  name: 'Rocket Squad',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocket',
  engineerCount: 6,
  avgPointsPerEngineer: 8, // 48 pts per sprint total
  sprintLengthWeeks: 2,
  sprintsInIncrement: 6, // 12 weeks / ~1 Quarter
  sizeMappings: [...DEFAULT_MAPPINGS],
};

export const MOCK_EPICS: Epic[] = [
  { id: 'e1', title: 'SSO Implementation', description: 'Integrate with Okta', originalSize: 'M', currentSize: 'M', status: 'backlog', source: 'Jira' },
  { id: 'e2', title: 'Mobile App Refactor', description: 'Convert to React Native', originalSize: 'XL', currentSize: 'XL', status: 'backlog', source: 'Jira' },
  { id: 'e3', title: 'User Dashboard', description: 'New analytics widgets', originalSize: 'S', currentSize: 'S', status: 'backlog', source: 'Trello' },
  { id: 'e4', title: 'Email Notifications', description: 'SendGrid integration', originalSize: 'XS', currentSize: 'XS', status: 'backlog', source: 'Jira' },
  { id: 'e5', title: 'Performance Audit', description: 'Lighthouse score improvement', originalSize: '2-XS', currentSize: '2-XS', status: 'backlog', source: 'Template' },
  { id: 'e6', title: 'Infrastructure Migration', description: 'Move to AWS', originalSize: 'L', currentSize: 'L', status: 'backlog', source: 'Jira' },
  { id: 'e7', title: 'Admin Panel V2', description: 'Internal tools update', originalSize: 'M', currentSize: 'M', status: 'backlog', source: 'Trello' },
];
