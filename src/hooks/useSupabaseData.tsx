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
  krasService 
} from '@/integrations/supabase/unitService';

// Define types for the different service methods
type FetchFunction = (userEmail?: string, divisionId?: string) => Promise<any[]>;
type AddFunction = (item: any) => Promise<any>;
type UpdateFunction = (id: string, item: any) => Promise<any>;
type DeleteFunction = (id: string) => Promise<boolean>;

// Generic hook for Supabase CRUD operations
export function useSupabaseData<T extends { id?: string }>(
  entityType: 'tasks' | 'projects' | 'risks' | 'assets' | 'kras',
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { instance, accounts } = useMsal();

  // Get the appropriate fetch method based on entity type
  const getFetchMethod = useCallback((): FetchFunction => {
    switch (entityType) {
      case 'tasks':
        return tasksService.getTasks;
      case 'projects':
        return projectsService.getProjects;
      case 'risks':
        return risksService.getRisks;
      case 'assets':
        return assetsService.getAssets;
      case 'kras':
        return krasService.getKRAs;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType]);

  // Get the appropriate add method based on entity type
  const getAddMethod = useCallback((): AddFunction => {
    switch (entityType) {
      case 'tasks':
        return tasksService.addTask;
      case 'projects':
        return projectsService.addProject;
      case 'risks':
        return risksService.addRisk;
      case 'assets':
        return assetsService.addAsset;
      case 'kras':
        return krasService.addKRA;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType]);

  // Get the appropriate update method based on entity type
  const getUpdateMethod = useCallback((): UpdateFunction => {
    switch (entityType) {
      case 'tasks':
        return tasksService.updateTask;
      case 'projects':
        return projectsService.updateProject;
      case 'risks':
        return risksService.updateRisk;
      case 'assets':
        return assetsService.updateAsset;
      case 'kras':
        return krasService.updateKRA;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType]);

  // Get the appropriate delete method based on entity type
  const getDeleteMethod = useCallback((): DeleteFunction => {
    switch (entityType) {
      case 'tasks':
        return tasksService.deleteTask;
      case 'projects':
        return projectsService.deleteProject;
      case 'risks':
        return risksService.deleteRisk;
      case 'assets':
        return assetsService.deleteAsset;
      case 'kras':
        return krasService.deleteKRA;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType]);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let fetchedData: any[] = [];
    let fetchError: Error | null = null;

    try {
      const fetchMethod = getFetchMethod();
      logger.info(`[useSupabaseData - fetchData] Fetching ${entityType}...`);

      if (entityType === 'assets') {
        logger.info(`[useSupabaseData - fetchData] Asset fetch requires logged-in user email.`);
        const account = accounts[0];

        if (account?.username) {
          const userEmail = account.username;
          logger.info(`[useSupabaseData - fetchData] Invoking get-my-assets function for email: ${userEmail}`);
          try {
            const { data: functionData, error: functionError } = await supabase.functions.invoke('get-my-assets', { 
              body: { user_email: userEmail }
            });

            if (functionError) {
              logger.error('[useSupabaseData - fetchData] Error invoking get-my-assets function:', functionError);
              fetchError = new Error(`Failed to fetch assets: ${functionError.message}`);
              fetchedData = [];
            } else {
              logger.info(`[useSupabaseData - fetchData] Successfully fetched assets via function.`);
              fetchedData = Array.isArray(functionData) ? functionData : [];
            }
          } catch (invokeErr) {
            logger.error('[useSupabaseData - fetchData] Exception invoking get-my-assets function:', invokeErr);
            fetchError = invokeErr instanceof Error ? invokeErr : new Error('Failed to invoke asset fetch function');
            fetchedData = [];
          }
        } else {
          logger.warn('[useSupabaseData - fetchData] No MSAL account/username found for asset fetch.');
          fetchError = new Error('User not authenticated or email missing.');
          fetchedData = [];
        }
      } else {
        logger.info(`[useSupabaseData - fetchData] Fetching non-asset entity type: ${entityType}`);
        fetchedData = await fetchMethod();
      }

      setData(fetchedData as T[]);

    } catch (err) {
      logger.error(`[useSupabaseData - fetchData] Error during ${entityType} fetch process:`, err);
      fetchError = err instanceof Error ? err : new Error(String(err));
      setData([]);
    } finally {
      setError(fetchError);
      setLoading(false);
    }
  }, [entityType, getFetchMethod, accounts]);

  // Add a new item
  const add = useCallback(async (item: Omit<T, 'id'>) => {
    if (accounts.length === 0) {
      logger.error('useSupabaseData - add: No MSAL user logged in');
      toast({
        title: "Error",
        description: "You must be logged in to add items",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      logger.info(`[useSupabaseData - add ${entityType}] Attempting to add item`, item);
      const addMethod = getAddMethod();
      // Add user info if needed by the service, e.g., item.created_by = user.id
      const newItem = await addMethod(item);
      
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