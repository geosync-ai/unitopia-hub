// src/types/kpi.ts

export interface Kpi {
  id: string | number; // Or use UUIDs
  name: string;
  target: number;
  actual?: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'At Risk' | 'On Track';
  comments?: string;
}

export interface Kra {
  id: string | number; // Or use UUIDs
  title: string;
  objective: string; // Assuming objective is stored as string, could be an ID linked to master data
  unit: string; // Assuming unit is stored as string, could be an ID
  startDate: string; // ISO date string format recommended (e.g., "YYYY-MM-DD")
  targetDate: string; // ISO date string format recommended
  assignees: User[]; // Array of user objects
  kpis: Kpi[];
  comments?: string; // Optional overall comments for the KRA
}

// Basic User interface, adjust as needed based on your actual user data structure
export interface User {
  id: string | number;
  name: string;
  avatarUrl?: string; // Optional avatar image URL
  initials?: string; // Fallback initials
} 