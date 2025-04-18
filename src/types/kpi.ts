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
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold' | 'at-risk' | 'on-track' | 'behind';
  comments?: string;
  assignees?: User[]; // Add assignees to KPI
  metric?: string;
  unit?: string;
  progress?: number;
  costAssociated?: number; // Add cost associated field
}

// Define possible KRA statuses
export type KraStatus = 'on-track' | 'at-risk' | 'off-track' | 'completed' | 'pending';

// KRA definition
export interface Kra {
  id: string | number; // Allow number for potential legacy or other integrations
  title: string;
  objectiveId?: string | number | null;
  unit?: string | null; // Unit or Department name
  unitId?: string | number | null; // FK to a potential 'units' table
  startDate?: string; // ISO Date string
  targetDate?: string; // ISO Date string
  unitKpis?: Kpi[]; // Renamed from kpis for clarity
  description?: string | null;
  department?: string | null; // Consider consolidating with unit
  status?: KraStatus; // Use the defined type
  owner?: User | null;
  ownerId?: string | number | null; // Add ownerId field
  createdAt?: string; // ISO Date string
  updatedAt?: string; // ISO Date string
  // Add nested objective structure from Supabase query
  unitObjectives?: { title: string } | null;
}

// Basic User interface, adjust as needed based on your actual user data structure
export interface User {
  id: string | number;
  name: string;
  email?: string; // Add email field
  avatarUrl?: string; // Optional avatar image URL
  initials?: string; // Fallback initials
}

// Add Objective interface
export interface Objective {
  id: string | number;
  name: string;
  description?: string; // Optional description
} 