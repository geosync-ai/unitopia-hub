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
  unit_id?: string;
  division_id?: string;
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
  unit_id?: string;
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
  unit_id?: string;
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
  unit_id?: string;
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
  unit_id?: string;
}

export interface UserAsset {
  id: string;
  name: string;
  type?: string;
  assigned_date: string;
  assigned_to?: string;
  assigned_to_email?: string;
  unit?: string;
  division?: string;
  purchase_date?: string;
  vendor?: string;
  warranty_expiry_date?: string;
  invoice_url?: string;
  expiry_date?: string;
  life_expectancy_years?: number;
  condition?: string;
  ytd_usage?: string;
  specifications?: Record<string, any>;
  notes?: string;
  barcode_url?: string;
  image_url?: string;
  admin_comments?: string;
  last_updated?: string;
  last_updated_by?: string;
  created_at?: string;
  checklist?: ChecklistItem[];
}

export interface OrganizationUnit {
  id: string;
  name: string;
  description?: string;
  code?: string;
  manager?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Division {
  id: string;
  name: string;
  description?: string;
  code: string;
  manager?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  position?: string;
  department?: string;
  isAdmin: boolean;
  divisionId?: string;
  divisionRole?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitMembership {
  id: string;
  userId: string;
  unitId: string;
  role: string;
  createdAt: Date;
}

export interface DivisionMembership {
  id: string;
  userId: string;
  divisionId: string;
  role: 'director' | 'manager' | 'officer' | 'staff';
  createdAt: Date;
}

export type DivisionRole = 'director' | 'manager' | 'officer' | 'staff';

export type StatusType = 
  | 'todo' | 'in-progress' | 'review' | 'done'
  | 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved' | 'accepted';

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
