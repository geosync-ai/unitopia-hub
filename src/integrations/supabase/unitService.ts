import { getSupabaseClient } from './supabaseClient';
import supabaseConfig from '@/config/supabase';

// Define Supabase table names
const TABLES = {
  TASKS: 'unit_tasks',
  PROJECTS: 'unit_projects',
  RISKS: 'unit_risks',
  ASSETS: 'unit_assets',
  KRAS: 'unit_kras',
  KPIS: 'unit_kpis'
};

// Task operations
export const tasksService = {
  // Get all tasks
  getTasks: async (userEmail?: string) => {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(TABLES.TASKS)
      .select('*');
    
    if (userEmail) {
      query = query.eq('assignee', userEmail);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Add a new task
  addTask: async (task: any) => {
    const supabase = getSupabaseClient();
    
    // Ensure task has created_at and updated_at
    const taskWithTimestamps = {
      ...task,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .insert([taskWithTimestamps])
      .select();
    
    if (error) {
      console.error('Error adding task:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Update a task
  updateTask: async (id: string, task: any) => {
    const supabase = getSupabaseClient();
    
    // Add updated_at timestamp
    const taskWithTimestamp = {
      ...task,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .update(taskWithTimestamp)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Delete a task
  deleteTask: async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.TASKS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
    
    return true;
  }
};

// Project operations
export const projectsService = {
  // Get all projects
  getProjects: async (userEmail?: string) => {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(TABLES.PROJECTS)
      .select('*');
    
    if (userEmail) {
      query = query.eq('manager', userEmail);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Add a new project
  addProject: async (project: any) => {
    const supabase = getSupabaseClient();
    
    // Ensure project has created_at and updated_at
    const projectWithTimestamps = {
      ...project,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .insert([projectWithTimestamps])
      .select();
    
    if (error) {
      console.error('Error adding project:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Update a project
  updateProject: async (id: string, project: any) => {
    const supabase = getSupabaseClient();
    
    // Add updated_at timestamp
    const projectWithTimestamp = {
      ...project,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .update(projectWithTimestamp)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Delete a project
  deleteProject: async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.PROJECTS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
    
    return true;
  }
};

// Risk operations
export const risksService = {
  // Get all risks
  getRisks: async (userEmail?: string) => {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(TABLES.RISKS)
      .select('*');
    
    if (userEmail) {
      query = query.eq('owner', userEmail);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching risks:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Add a new risk
  addRisk: async (risk: any) => {
    const supabase = getSupabaseClient();
    
    // Ensure risk has created_at and updated_at
    const riskWithTimestamps = {
      ...risk,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.RISKS)
      .insert([riskWithTimestamps])
      .select();
    
    if (error) {
      console.error('Error adding risk:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Update a risk
  updateRisk: async (id: string, risk: any) => {
    const supabase = getSupabaseClient();
    
    // Add updated_at timestamp
    const riskWithTimestamp = {
      ...risk,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.RISKS)
      .update(riskWithTimestamp)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating risk:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Delete a risk
  deleteRisk: async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.RISKS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting risk:', error);
      throw error;
    }
    
    return true;
  }
};

// Asset operations
export const assetsService = {
  // Get all assets
  getAssets: async (userEmail?: string) => {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(TABLES.ASSETS)
      .select('*');
    
    if (userEmail) {
      query = query.eq('assignedTo', userEmail);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Add a new asset
  addAsset: async (asset: any) => {
    const supabase = getSupabaseClient();
    
    // Ensure asset has created_at and updated_at
    const assetWithTimestamps = {
      ...asset,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.ASSETS)
      .insert([assetWithTimestamps])
      .select();
    
    if (error) {
      console.error('Error adding asset:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Update an asset
  updateAsset: async (id: string, asset: any) => {
    const supabase = getSupabaseClient();
    
    // Add updated_at timestamp
    const assetWithTimestamp = {
      ...asset,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.ASSETS)
      .update(assetWithTimestamp)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Delete an asset
  deleteAsset: async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.ASSETS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
    
    return true;
  }
};

// KRA operations
export const krasService = {
  // Get all KRAs
  getKRAs: async (userEmail?: string) => {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(TABLES.KRAS)
      .select('*');
    
    if (userEmail) {
      query = query.eq('responsible', userEmail);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching KRAs:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Add a new KRA
  addKRA: async (kra: any) => {
    const supabase = getSupabaseClient();
    
    // Ensure KRA has created_at and updated_at
    const kraWithTimestamps = {
      ...kra,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.KRAS)
      .insert([kraWithTimestamps])
      .select();
    
    if (error) {
      console.error('Error adding KRA:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Update a KRA
  updateKRA: async (id: string, kra: any) => {
    const supabase = getSupabaseClient();
    
    // Add updated_at timestamp
    const kraWithTimestamp = {
      ...kra,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.KRAS)
      .update(kraWithTimestamp)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating KRA:', error);
      throw error;
    }
    
    return data?.[0] || null;
  },
  
  // Delete a KRA
  deleteKRA: async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.KRAS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting KRA:', error);
      throw error;
    }
    
    return true;
  }
};

export default {
  tasks: tasksService,
  projects: projectsService,
  risks: risksService,
  assets: assetsService,
  kras: krasService
}; 