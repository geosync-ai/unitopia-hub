import { useState, useEffect, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { supabase, logger } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { loginRequest } from '@/authConfig'; // Import MSAL request scopes
import { 
  tasksService, 
  projectsService, 
  risksService, 
  assetsService, 
  krasService,
  kpisService,
  objectivesService
} from '@/integrations/supabase/unitService';

// Define the type for the 'id' field, assuming it's always string or undefined
interface Identifiable {
  id?: string;
  assigned_to_email?: string | null; // Ensure this is defined for all T
}

// Define more specific function types
type FetchFunction<T> = () => Promise<T[]>; // Standard fetch (now less used)
type FetchWithEmailFunction = (userEmail: string) => Promise<any[]>; // Function-based fetch
type AddFunction<T> = (item: T) => Promise<T>;
type UpdateFunction<T> = (id: string, item: Partial<T>) => Promise<T>;
type DeleteFunction = (id: string) => Promise<boolean>;

// Type guard for MSAL account info
interface MsalAccountInfo {
  homeAccountId?: string;
  environment?: string;
  tenantId?: string;
  username?: string; // This typically holds the email
  localAccountId?: string;
  name?: string;
}

function isMsalAccountInfo(account: any): account is MsalAccountInfo {
  return account && typeof account.username === 'string';
}

// Define the possible entity types
type EntityType = 'tasks' | 'projects' | 'risks' | 'assets' | 'kras' | 'kpis' | 'objectives'; // Added kpis, objectives

// Extend the generic type to include assigned_to_email
export function useSupabaseData<T extends Identifiable>(
  entityType: EntityType,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { accounts } = useMsal(); // Get MSAL accounts

  // Memoize helper functions for CRUD operations
  const getFetchMethod = useCallback((): FetchFunction<T> => {
    switch (entityType) {
      case 'tasks': return tasksService.getTasks;
      case 'projects': return projectsService.getProjects;
      case 'risks': return risksService.getRisks;
      case 'assets': return assetsService.getAssets;
      case 'kras': return krasService.getKRAs;
      case 'kpis': return kpisService.getKPIs;
      case 'objectives': return objectivesService.getObjectives;
      default: throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType]);

  // Get the appropriate add method based on entity type
  const getAddMethod = useCallback((): AddFunction<T> => {
    switch (entityType) {
      case 'tasks': return tasksService.addTask;
      case 'projects': return projectsService.addProject;
      case 'risks': return risksService.addRisk;
      case 'assets': return assetsService.addAsset;
      case 'kras': return krasService.addKRA;
      case 'kpis': return kpisService.addKPI;
      case 'objectives': return objectivesService.addObjective;
      default: throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType]);

  // Get the appropriate update method based on entity type
  const getUpdateMethod = useCallback((): UpdateFunction<T> => {
    switch (entityType) {
      case 'tasks': return tasksService.updateTask;
      case 'projects': return projectsService.updateProject;
      case 'risks': return risksService.updateRisk;
      case 'assets': return assetsService.updateAsset;
      case 'kras': return krasService.updateKRA;
      case 'kpis': return kpisService.updateKPI;
      case 'objectives': return objectivesService.updateObjective;
      default: throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType]);

  // Get the appropriate delete method based on entity type
  const getDeleteMethod = useCallback((): DeleteFunction => {
    switch (entityType) {
      case 'tasks': return tasksService.deleteTask;
      case 'projects': return projectsService.deleteProject;
      case 'risks': return risksService.deleteRisk;
      case 'assets': return assetsService.deleteAsset;
      case 'kras': return krasService.deleteKRA;
      case 'kpis': return kpisService.deleteKPI;
      case 'objectives': return objectivesService.deleteObjective;
      default: throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType]);

  // Main data fetching logic
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let fetchedData: T[] = [];
    let fetchError: Error | null = null;

    // All entity types now require the user's email for function invocation
    const account = accounts[0];
    if (!account || !isMsalAccountInfo(account) || !account.username) {
      logger.warn(`[useSupabaseData - fetchData ${entityType}] No MSAL account/username found.`);
      fetchError = new Error('User not authenticated or email missing.');
      setData([]);
      setError(fetchError);
      setLoading(false);
      return;
    }

    const userEmail = account.username;
    const functionNameMap: Record<EntityType, string> = {
      tasks: 'get-my-tasks',
      projects: 'get-my-projects',
      risks: 'get-my-risks',
      assets: 'get-my-assets',
      kras: 'get-my-kras',
      kpis: 'get-my-kpis',
      objectives: 'get-my-objectives',
    };
    const functionName = functionNameMap[entityType];

    logger.info(`[useSupabaseData - fetchData ${entityType}] Invoking ${functionName} for email: ${userEmail}`);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        functionName,
        { body: { user_email: userEmail } }
      );

      if (functionError) {
        logger.error(`[useSupabaseData - fetchData ${entityType}] Error invoking ${functionName}:`, functionError);
        fetchError = new Error(`Failed to fetch ${entityType}: ${functionError.message}`);
        fetchedData = [];
      } else {
        logger.info(`[useSupabaseData - fetchData ${entityType}] Successfully fetched ${entityType} via function ${functionName}. Count: ${functionData?.length ?? 0}`);
        // Ensure the data is always an array, even if the function returns null/undefined
        fetchedData = Array.isArray(functionData) ? functionData as T[] : [];
      }
    } catch (invokeErr) {
      logger.error(`[useSupabaseData - fetchData ${entityType}] Exception invoking ${functionName}:`, invokeErr);
      fetchError = invokeErr instanceof Error ? invokeErr : new Error(`Failed to invoke ${entityType} fetch function`);
      fetchedData = [];
    } finally {
      setData(fetchedData);
      setError(fetchError);
      setLoading(false);
    }
  }, [entityType, accounts]); // Removed getFetchMethod as it's no longer used here

  // Add a new item
  const add = useCallback(async (item: Omit<T, 'id'>) => {
    const account = accounts[0]; // Get the current MSAL account
    const userEmail = account?.username; // Get the email (username)

    if (!userEmail) { // Check if email exists
      logger.error('useSupabaseData - add: No MSAL user email found');
      toast({
        title: "Authentication Error",
        description: "Could not determine user email. Please log in again.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      logger.info(`[useSupabaseData - add ${entityType}] Attempting to add item`, item);
      const addMethod = getAddMethod();

      // Prepare the data with the assigned email
      const itemWithEmail = { 
        ...item, 
        assigned_to_email: userEmail 
      };
      
      logger.info(`[useSupabaseData - add ${entityType}] Item with email:`, itemWithEmail);

      // Pass the modified item to the specific add method with type assertion
      const newItem = await addMethod(itemWithEmail as T);
      
      if (newItem) {
        setData(prev => [...prev, newItem as unknown as T]);
        toast({
          title: "Success",
          description: `${entityType.slice(0, -1)} added successfully`
        });
      }
      
      return newItem;
    } catch (err) {
      logger.error(`Error adding ${entityType.slice(0, -1)}:`, err);
      toast({
        title: "Error",
        description: `Failed to add ${entityType.slice(0, -1)}`,
        variant: "destructive"
      });
      
      // Log the specific error to console for debugging
      if (err && typeof err === 'object' && 'code' in err) {
        console.log(`Database error [${(err as any).code}]: ${(err as any).message}`);
      }
      
      return null;
    }
  }, [entityType, getAddMethod, accounts]);

  // Update an item
  const update = useCallback(async (id: string, updateData: Partial<T>) => {
    if (accounts.length === 0) {
      logger.error('useSupabaseData - update: No MSAL user logged in');
      toast({
        title: "Error",
        description: "You must be logged in to update items",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const updateMethod = getUpdateMethod();
      // Add user info if needed, e.g., updateData.updated_by = user.id
      const updatedItem = await updateMethod(id, updateData);
      
      if (updatedItem) {
        setData(prev => prev.map(item => 
          item.id === id ? { ...item, ...updatedItem } as T : item
        ));
        toast({
          title: "Success",
          description: `${entityType.slice(0, -1)} updated successfully`
        });
      }
      
      return updatedItem;
    } catch (err) {
      logger.error(`Error updating ${entityType.slice(0, -1)}:`, err);
      toast({
        title: "Error",
        description: `Failed to update ${entityType.slice(0, -1)}`,
        variant: "destructive"
      });
      return null;
    }
  }, [entityType, getUpdateMethod, accounts]);

  // Delete an item
  const remove = useCallback(async (id: string) => {
    if (accounts.length === 0) {
      logger.error('useSupabaseData - remove: No MSAL user logged in');
      toast({
        title: "Error",
        description: "You must be logged in to delete items",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const deleteMethod = getDeleteMethod();
      await deleteMethod(id);
      
      setData(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: `${entityType.slice(0, -1)} deleted successfully`
      });
      
      return true;
    } catch (err) {
      logger.error(`Error deleting ${entityType.slice(0, -1)}:`, err);
      toast({
        title: "Error",
        description: `Failed to delete ${entityType.slice(0, -1)}`,
        variant: "destructive"
      });
      return false;
    }
  }, [entityType, getDeleteMethod, accounts]);

  // Function to manually trigger a refresh
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    refresh
  };
}

// Convenience hooks for specific entity types
export function useTasksData(initialData = []) {
  return useSupabaseData('tasks', initialData);
}

export function useProjectsData(initialData = []) {
  return useSupabaseData('projects', initialData);
}

export function useRisksData(initialData = []) {
  return useSupabaseData('risks', initialData);
}

export function useAssetsData(initialData = []) {
  return useSupabaseData('assets', initialData);
}

export function useKRAsData(initialData = []) {
  return useSupabaseData('kras', initialData);
} 