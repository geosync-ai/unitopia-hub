import { getSupabaseClient } from './supabaseClient';
import supabaseConfig from '@/config/supabase';
import { Objective } from '@/types/kpi'; // Import Objective type

// Define Supabase table names
const TABLES = {
  TASKS: 'unit_tasks',
  PROJECTS: 'unit_projects',
  RISKS: 'unit_risks',
  ASSETS: 'assets',
  KRAS: 'unit_kras',
  KPIS: 'unit_kpis',
  OBJECTIVES: 'unit_objectives' // Add objectives table name
};

// Utility to convert camelCase to snake_case
const camelToSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnakeCase);
  }

  // Handle risk likelihood specially to ensure it correctly matches enum type
  if (obj.likelihood) {
    const validLikelihoods = ['low', 'medium', 'high', 'very-high'];
    if (!validLikelihoods.includes(obj.likelihood)) {
      console.warn(`Converting invalid likelihood '${obj.likelihood}' to 'low'`);
      obj.likelihood = 'low';
    }
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      // Special case for likelihood to ensure it matches DB enum
      if (key === 'likelihood') {
        const validLikelihoods = ['low', 'medium', 'high', 'very-high'];
        if (!validLikelihoods.includes(value as string)) {
          console.warn(`Converting invalid likelihood value: "${value}" to "low"`);
          value = 'low';
        }
        return ['likelihood', value];
      }
      
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      
      // Special handling for date values
      if (value instanceof Date) {
        // Convert Date objects to ISO strings for PostgreSQL
        value = value.toISOString();
      } else if (key === 'startDate' || key === 'dueDate' || key === 'endDate' || 
                key === 'purchaseDate' || key === 'warrantyExpiry' || 
                key === 'identificationDate' || key === 'createdAt' || key === 'updatedAt') {
        // For date fields that might be objects or already strings
        if (value && typeof value === 'object' && !(value instanceof Date)) {
          // Handle complex objects that should be dates
          if ('toISOString' in value && typeof value.toISOString === 'function') {
            value = value.toISOString();
          } else {
            // If it's an object but not a valid date, convert to null
            value = null;
          }
        } else if (value === '') {
          // Empty strings should be null for date fields
          value = null;
        }
        // Strings that are valid ISO dates can be passed through
      }
      
      // Handle nested objects (except for checklist which is stored as JSONB)
      else if (key !== 'checklist' && value !== null && typeof value === 'object') {
        value = camelToSnakeCase(value);
      }
      
      return [snakeKey, value];
    })
  );
};

// Utility to convert snake_case to camelCase
const snakeToCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelCase);
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Handle nested objects
      if (key !== 'checklist' && value !== null && typeof value === 'object') {
        // Don't convert the checklist JSONB since it's stored as-is
        value = snakeToCamelCase(value);
      }
      
      return [camelKey, value];
    })
  );
};

// Task operations
export const tasksService = {
  // Get all tasks
  getTasks: async (userEmail?: string, divisionId?: string) => {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(TABLES.TASKS)
      .select('*');
    
    // If division ID is provided, filter by that specific division
    if (divisionId) {
      query = query.eq('division_id', divisionId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
    
    // Convert snake_case to camelCase for frontend
    return (data || []).map(snakeToCamelCase);
  },
  
  // Add a new task
  addTask: async (task: any) => {
    const supabase = getSupabaseClient();
    
    // Ensure task has division_id - use current division from context if available
    if (!task.divisionId) {
      // Get current division ID from localStorage or context
      const currentDivisionId = localStorage.getItem('current_division_id');
      if (currentDivisionId) {
        task.divisionId = currentDivisionId;
      }
    }
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseTask = camelToSnakeCase(task);
    
    // Ensure task has created_at and updated_at
    const taskWithTimestamps = {
      ...snakeCaseTask,
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
    
    // Convert back to camelCase for frontend
    return data?.[0] ? snakeToCamelCase(data[0]) : null;
  },
  
  // Update a task
  updateTask: async (id: string, task: any) => {
    const supabase = getSupabaseClient();
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseTask = camelToSnakeCase(task);
    
    // Add updated_at timestamp
    const taskWithTimestamp = {
      ...snakeCaseTask,
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
    
    // Convert back to camelCase for frontend
    return data?.[0] ? snakeToCamelCase(data[0]) : null;
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
  getProjects: async (userEmail?: string, divisionId?: string) => {
    console.log(`[projectsService.getProjects] Fetching projects with userEmail: ${userEmail}, divisionId: ${divisionId}`); // Log input parameters
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(TABLES.PROJECTS)
      .select('*');
    
    // If division ID is provided, filter by that specific division
    if (divisionId) {
      query = query.eq('division_id', divisionId);
    }
    
    const { data, error } = await query;

    console.log(`[projectsService.getProjects] Raw data from Supabase:`, data); // Log raw data
    console.log(`[projectsService.getProjects] Error from Supabase:`, error); // Log error
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
    
    // Convert snake_case to camelCase for frontend
    const mappedData = (data || []).map(snakeToCamelCase);
    console.log(`[projectsService.getProjects] Data after snakeToCamelCase:`, mappedData); // Log mapped data
    return mappedData;
  },
  
  // Add a new project
  addProject: async (project: any) => {
    const supabase = getSupabaseClient();
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseProject = camelToSnakeCase(project);
    
    // Ensure project has created_at and updated_at
    const projectWithTimestamps = {
      ...snakeCaseProject,
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
    
    // Convert back to camelCase for frontend
    return data?.[0] ? snakeToCamelCase(data[0]) : null;
  },
  
  // Update a project
  updateProject: async (id: string, project: any) => {
    const supabase = getSupabaseClient();
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseProject = camelToSnakeCase(project);
    
    // Add updated_at timestamp
    const projectWithTimestamp = {
      ...snakeCaseProject,
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
    
    // Convert back to camelCase for frontend
    return data?.[0] ? snakeToCamelCase(data[0]) : null;
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
  // Debug function to check the table schema
  checkRiskTableSchema: async () => {
    const supabase = getSupabaseClient();
    
    try {
      // Query the constraint information
      const { data: checkConstraints, error: constraintError } = await supabase
        .from('information_schema.check_constraints')
        .select('constraint_name, check_clause')
        .like('constraint_name', '%unit_risks_likelihood%');
      
      if (constraintError) {
        console.error('Error fetching constraint info:', constraintError);
      } else {
        console.log('Risk likelihood constraints:', checkConstraints);
      }
      
      // Query column information
      const { data: columnInfo, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, udt_name, is_nullable, column_default')
        .eq('table_name', 'unit_risks')
        .eq('column_name', 'likelihood');
      
      if (columnError) {
        console.error('Error fetching column info:', columnError);
      } else {
        console.log('Risk likelihood column info:', columnInfo);
      }
      
      return { checkConstraints, columnInfo };
    } catch (err) {
      console.error('Error checking schema:', err);
      return null;
    }
  },
  
  // Get all risks
  getRisks: async (userEmail?: string, divisionId?: string) => {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(TABLES.RISKS)
      .select('*');
    
    // Filter by owner if userEmail is provided (optional, adjust as needed)
    // if (userEmail) {
    //   query = query.eq('owner', userEmail); 
    // }

    // Filter by division_id if divisionId is provided
    if (divisionId) {
      query = query.eq('division_id', divisionId);
    } else {
      // Optional: Handle case where no division is selected?
      // Maybe fetch only risks with null division_id or apply different logic?
      // For now, if no divisionId, it fetches all risks (potentially filtered by userEmail above)
      console.warn('[risksService.getRisks] No divisionId provided, fetching all risks (potentially filtered by owner).');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching risks:', error);
      throw error;
    }
    
    // Convert snake_case to camelCase for frontend
    return (data || []).map(snakeToCamelCase);
  },
  
  // Add a new risk
  addRisk: async (risk: any) => {
    const supabase = getSupabaseClient();
    
    // Update with potential alternative enum values for likelihood
    // The database constraint is rejecting 'possible', so let's try with a different set
    const validLikelihoods = ['low', 'medium', 'high', 'very-high'];
    
    // Map old likelihood values to new ones if needed
    let safeLikelihood = 'low'; // Default fallback
    if (risk.likelihood === 'unlikely') safeLikelihood = 'low';
    else if (risk.likelihood === 'possible') safeLikelihood = 'medium';
    else if (risk.likelihood === 'likely') safeLikelihood = 'high';
    else if (risk.likelihood === 'certain') safeLikelihood = 'very-high';
    else if (validLikelihoods.includes(risk.likelihood)) safeLikelihood = risk.likelihood;
    
    // Clone the risk object to avoid modifying the original
    const cleanRisk = { ...risk };
    
    // Explicitly set likelihood to a safe value
    cleanRisk.likelihood = safeLikelihood;
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseRisk = camelToSnakeCase(cleanRisk);
    
    // Ensure risk has created_at and updated_at
    const riskWithTimestamps = {
      ...snakeCaseRisk,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[unitService.addRisk] Final payload before insert:', JSON.stringify(riskWithTimestamps, null, 2));

    try {
      // Try a simpler, direct approach
      const { data, error } = await supabase
        .from(TABLES.RISKS)
        .insert([riskWithTimestamps])
        .select();
      
      if (error) {
        console.error('Error adding risk:', error);
        console.error('Failed SQL constraint:', error.code);
        console.error('Error details:', error.details);
        console.error('Error message:', error.message);
        console.error('Error hint:', error.hint);
        throw error;
      }
      
      // Convert back to camelCase for frontend
      return data?.[0] ? snakeToCamelCase(data[0]) : null;
    } catch (err) {
      console.error('Unexpected error in addRisk:', err);
      throw err;
    }
  },
  
  // Update a risk
  updateRisk: async (id: string, risk: any) => {
    const supabase = getSupabaseClient();
    
    // Use the same updated valid likelihood values
    const validLikelihoods = ['low', 'medium', 'high', 'very-high'];
    
    // Map old likelihood values to new ones if needed
    let safeLikelihood = 'low'; // Default fallback
    if (risk.likelihood === 'unlikely') safeLikelihood = 'low';
    else if (risk.likelihood === 'possible') safeLikelihood = 'medium';
    else if (risk.likelihood === 'likely') safeLikelihood = 'high';
    else if (risk.likelihood === 'certain') safeLikelihood = 'very-high';
    else if (validLikelihoods.includes(risk.likelihood)) safeLikelihood = risk.likelihood;
    
    // Update the object with the safe likelihood
    const cleanRisk = { ...risk, likelihood: safeLikelihood };
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseRisk = camelToSnakeCase(cleanRisk);
    
    // Add updated_at timestamp
    const riskWithTimestamp = {
      ...snakeCaseRisk,
      updated_at: new Date().toISOString()
    };
    
    // Log the processed data
    console.log('Processed risk data being sent to Supabase for update:', 
      JSON.stringify({
        id,
        originalLikelihood: risk.likelihood,
        safeLikelihood,
        processedRisk: riskWithTimestamp
      })
    );
    
    const { data, error } = await supabase
      .from(TABLES.RISKS)
      .update(riskWithTimestamp)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating risk:', error);
      throw error;
    }
    
    // Convert back to camelCase for frontend
    return data?.[0] ? snakeToCamelCase(data[0]) : null;
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
  getAssets: async (/* userEmail?: string */) => { // Removed userEmail parameter as it's not used for filtering here
    const supabase = getSupabaseClient();
    
    // Fetch ALL assets, filtering will happen in the frontend component
    let query = supabase
      .from(TABLES.ASSETS)
      .select('*');
    
    // Removed the filter: query = query.eq('assigned_to', userEmail);
    
    try {
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching assets:', error);
        throw error;
      }
      
      // Convert snake_case to camelCase for frontend
      return (data || []).map(snakeToCamelCase);
    } catch (err) {
      console.error('Error fetching assets catch block:', err); // Added log here
      // Still return empty array to allow UI to render
      return [];
    }
  },
  
  // Add a new asset
  addAsset: async (asset: any) => {
    const supabase = getSupabaseClient();
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseAsset = camelToSnakeCase(asset);
    
    // Ensure asset has created_at and updated_at
    const assetWithTimestamps = {
      ...snakeCaseAsset,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      const { data, error } = await supabase
        .from(TABLES.ASSETS)
        .insert([assetWithTimestamps])
        .select();
      
      if (error) {
        console.error('Error adding asset:', error);
        throw error;
      }
      
      // Convert back to camelCase for frontend
      return data?.[0] ? snakeToCamelCase(data[0]) : null;
    } catch (error) {
      console.error('Error adding asset:', error);
      throw error;
    }
  },
  
  // Update an asset
  updateAsset: async (id: string, asset: any) => {
    const supabase = getSupabaseClient();
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseAsset = camelToSnakeCase(asset);
    
    // Add updated_at timestamp
    const assetWithTimestamp = {
      ...snakeCaseAsset,
      updated_at: new Date().toISOString()
    };
    
    try {
      const { data, error } = await supabase
        .from(TABLES.ASSETS)
        .update(assetWithTimestamp)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating asset:', error);
        throw error;
      }
      
      // Convert back to camelCase for frontend
      return data?.[0] ? snakeToCamelCase(data[0]) : null;
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
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
      // Fetch all KRA columns (*) AND all columns from related KPIs (unit_kpis(*))
      // ALSO fetch the title from the related objective
      .select(`
        *,
        unit_kpis(*),
        unit_objectives ( title )
      `); 
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching KRAs:', error);
      throw error;
    }
    
    console.log("[krasService.getKRAs] Raw data from Supabase (before conversion):", JSON.stringify(data, null, 2)); // Add log before conversion

    // Convert snake_case to camelCase for frontend
    const camelCaseData = (data || []).map(snakeToCamelCase);

    console.log("[krasService.getKRAs] Data after snakeToCamelCase:", camelCaseData);

    return camelCaseData;
  },
  
  // Add a new KRA
  addKRA: async (kra: any) => {
    const supabase = getSupabaseClient();
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseKra = camelToSnakeCase(kra);
    
    // Ensure KRA has created_at and updated_at
    const kraWithTimestamps = {
      ...snakeCaseKra,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Ensure status is a valid enum value for the DB
    // Valid values in DB constraint: 'on-track', 'at-risk', 'off-track', 'completed', 'pending'
    if (kraWithTimestamps.status) {
      const validStatuses = ['on-track', 'at-risk', 'off-track', 'completed', 'pending'];
      if (!validStatuses.includes(kraWithTimestamps.status)) {
        // Map to a valid status or default to 'pending'
        const statusMapping: Record<string, string> = {
          'At Risk': 'at-risk',
          'On Track': 'on-track',
          'Off Track': 'off-track',
          'Completed': 'completed',
          'Pending': 'pending',
          'Draft': 'pending'
        };
        kraWithTimestamps.status = statusMapping[kraWithTimestamps.status] || 'pending';
      }
    } else {
      kraWithTimestamps.status = 'pending'; // Default status
    }
    
    // Ensure division_id is present
    if (!kraWithTimestamps.division_id) {
      // Get current division ID from localStorage
      const currentDivisionId = localStorage.getItem('current_division_id');
      if (currentDivisionId) {
        kraWithTimestamps.division_id = currentDivisionId;
      }
    }
    
    console.log('Prepared KRA data for insertion:', kraWithTimestamps);
    
    try {
      const { data, error } = await supabase
        .from(TABLES.KRAS)
        .insert([kraWithTimestamps])
        .select();
      
      if (error) {
        console.error('Error adding KRA:', error);
        throw error;
      }
      
      // Convert back to camelCase for frontend
      return data?.[0] ? snakeToCamelCase(data[0]) : null;
    } catch (error) {
      console.error('Failed to create KRA:', error);
      throw error;
    }
  },
  
  // Update a KRA
  updateKRA: async (id: string, kra: any) => {
    const supabase = getSupabaseClient();
    
    // Convert camelCase properties to snake_case for DB
    const snakeCaseKra = camelToSnakeCase(kra);
    
    // Add updated_at timestamp
    const kraWithTimestamp = {
      ...snakeCaseKra,
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
    
    // Convert back to camelCase for frontend
    return data?.[0] ? snakeToCamelCase(data[0]) : null;
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

// Define the service object (assuming one exists, otherwise create it)
export const unitService = { // Or whatever your service object is named
  
  // --- ADD THIS FUNCTION ---
  getAllObjectives: async (): Promise<Objective[]> => {
    const supabase = getSupabaseClient();
    console.log("[unitService] Fetching all objectives...");
    try {
      const { data, error } = await supabase
        .from(TABLES.OBJECTIVES)
        .select('*')
        .order('created_at', { ascending: true }); // Optional: order them

      if (error) {
        console.error("[unitService] Error fetching objectives:", error);
        throw error;
      }

      console.log(`[unitService] Fetched ${data?.length || 0} objectives.`);

      // Map snake_case (DB: title) to camelCase (Frontend: name)
      return data ? data.map(dbObjective => ({
        id: dbObjective.id, // uuid
        name: dbObjective.title, // Map title to name
        description: dbObjective.description,
        // Map other fields if needed (e.g., status, unit_name)
      })) : [];
    } catch (error) {
      console.error("[unitService] Unexpected error in getAllObjectives:", error);
      throw error; // Re-throw the error to be handled by the calling component
    }
  },

  // Delete an objective
  deleteObjective: async (id: string) => {
    const supabase = getSupabaseClient();
    console.log(`[unitService] Deleting objective with ID: ${id}`);
    const { error } = await supabase
      .from(TABLES.OBJECTIVES)
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`[unitService] Error deleting objective ID ${id}:`, error);
      throw error;
    }
    
    console.log(`[unitService] Objective ID ${id} deleted successfully.`);
    return true;
  },
  // --- END ADDED FUNCTION ---

  // ... other existing service functions (tasksService, projectsService, etc.) ...
};

// Export individual services if structured that way
// e.g., export const tasksService = { ... }; export const projectsService = { ... }; 