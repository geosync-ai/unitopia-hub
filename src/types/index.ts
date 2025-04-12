// Import the ChecklistItem interface
import { ChecklistItem } from '@/components/ChecklistSection';

// Define Risk interface with all required properties
export interface Risk {
  id: string;
  title: string;
  description: string;
  status: 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved' | 'accepted';
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high' | 'very-high';
  category: string;
  owner: string;
  identificationDate: Date;
  mitigationPlan?: string;
  createdAt: Date;
  updatedAt: Date;
  checklist?: ChecklistItem[];
}

export interface KPI {
  id: string;
  name: string;
  date: Date;
  startDate: Date;
  target: string;
  actual: string;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  description: string;
  notes: string;
  checklist?: ChecklistItem[];
}

export interface KRA {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  department: string;
  responsible: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'open' | 'in-progress' | 'closed';
  kpis: KPI[];
  createdAt: string;
  updatedAt: string;
  checklist?: ChecklistItem[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  dueDate: string;
  assignedTo?: string;
  startDate?: Date;
  projectId?: string;
  projectName?: string;
  completionPercentage?: number;
  checklist?: ChecklistItem[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  startDate: Date;
  endDate: Date;
  manager: string;
  budget: number;
  budgetSpent: number;
  progress: number;
  risks: Risk[];
  tasks: Task[];
  checklist?: ChecklistItem[];
}

export interface UserAsset {
  id: string;
  name: string;
  type: 'laptop' | 'mobile' | 'tablet' | 'software' | 'other';
  serialNumber: string;
  assignedTo: string;
  department: string;
  purchaseDate: Date;
  warrantyExpiry: Date;
  status: 'active' | 'maintenance' | 'retired';
  notes: string;
  imageUrl?: string;
  checklist?: ChecklistItem[];
}

export type StatusType = 
  | 'todo' | 'in-progress' | 'review' | 'done'
  | 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved'
  | 'planned' | 'in-progress' | 'completed' | 'on-hold';

export type KraItem = {
  kra: KRA;
  kpi: KPI;
  index: number;
};

// Filter state types
export type FilterState = {
  [key: string]: string;
};

export type TaskFilterState = FilterState & {
  status: string;
  assignee: string;
  priority: string;
  dueDate: string;
};

export type KraFilterState = FilterState & {
  kraId: string;
  department: string;
  kpiStatus: string;
  responsible: string;
};

export type ProjectFilterState = FilterState & {
  status: string;
  manager: string;
  dateRange: string;
};

export type RiskFilterState = FilterState & {
  status: string;
  impact: string;
  likelihood: string;
  category: string;
  owner: string;
};

export type AssetFilterState = FilterState & {
  type: string;
  status: string;
  department: string;
  assignedTo: string;
}; 