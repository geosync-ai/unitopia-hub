// src/types/kpi.ts

export interface Kpi {
  tempId?: string; // For React keys before saving
  id: string | number; // Or use UUIDs
  name: string;
  description?: string; // Add description field
  target: number;
  actual?: number;
  startDate?: string; // Add KPI start date
  targetDate?: string; // Add KPI target date (or 'dueDate')
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'At Risk' | 'On Track';
  comments?: string;
  assignees?: User[]; // Add assignees to KPI
  metric?: string;
  unit?: string;
  progress?: number;
  costAssociated?: number; // Add cost associated field
}

export interface Kra {
  id: string | number; // Or use UUIDs
  title: string;
  objectiveId?: string | number; // Add this line
  unit: string; // Assuming unit is stored as string, could be an ID. Let's treat this as unitId for form consistency.
  startDate: string; // ISO date string format recommended (e.g., "YYYY-MM-DD")
  targetDate: string; // ISO date string format recommended
  unitKpis: Kpi[];
  description?: string; // Use description to match database column for KRA notes
  department: string; // Seems redundant if unit represents department? Keep for now.
  status: 'on-track' | 'at-risk' | 'off-track' | 'completed' | 'pending';
  owner: User;
  isEditing?: boolean; // Client-side state
}

// Basic User interface, adjust as needed based on your actual user data structure
export interface User {
  id: string | number;
  name: string;
  avatarUrl?: string; // Optional avatar image URL
  initials?: string; // Fallback initials
}

// Add Objective interface
export interface Objective {
  id: string | number;
  name: string;
  description?: string; // Optional description
} 