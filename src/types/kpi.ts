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
}

export interface Kra {
  id: string | number; // Or use UUIDs
  title: string;
  objective: string; // Assuming objective is stored as string, could be an ID linked to master data
  unit: string; // Assuming unit is stored as string, could be an ID
  startDate: string; // ISO date string format recommended (e.g., "YYYY-MM-DD")
  targetDate: string; // ISO date string format recommended
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