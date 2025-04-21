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
        logger.info(`[useSupabaseData - fetchData] Asset fetch requires MSAL token.`);
        if (accounts[0]) { // Check if user is logged in via MSAL
          try {
            const tokenResponse = await instance.acquireTokenSilent({
              ...loginRequest, // Use scopes defined in your config
              account: accounts[0]
            });
            logger.info(`[useSupabaseData - fetchData] MSAL token acquired successfully.`);
            // Call fetchMethod (assetsService.getAssets) with the token
            fetchedData = await fetchMethod(tokenResponse.accessToken);
          } catch (tokenError: any) { // Catch token acquisition error
            logger.error('[useSupabaseData - fetchData] MSAL acquireTokenSilent error:', tokenError);
            // Potentially trigger interactive login if silent fails (e.g., consent required)
            if (tokenError.name === "InteractionRequiredAuthError" || tokenError.name === "BrowserAuthError") {
              // Consider handling interaction_required errors, maybe by setting an error state
              fetchError = new Error('Could not get authentication token silently. Interaction required.');
            } else {
              fetchError = tokenError instanceof Error ? tokenError : new Error('Failed to acquire auth token');
            }
          }
        } else {
          logger.warn('[useSupabaseData - fetchData] No MSAL account found for asset fetch.');
          fetchError = new Error('User not authenticated via MSAL.');
          // Optionally call fetchMethod without token to let Edge Function handle anon (if designed to)
          // fetchedData = await fetchMethod(); 
        }
      } else {
        // For other entity types, call fetchMethod without token
        fetchedData = await fetchMethod();
      }

      // If fetch was successful (or not attempted due to token error handled above)
      if (!fetchError) {
         setData(fetchedData as T[]);
      }

    } catch (err) {
      // Catch errors from the fetchMethod call itself
      logger.error(`[useSupabaseData - fetchData] Error during ${entityType} fetch:`, err);
      fetchError = err instanceof Error ? err : new Error(String(err));
      setData([]); // Clear data on error
    } finally {
      setError(fetchError); // Set final error state
      setLoading(false);
    }
  }, [entityType, getFetchMethod, instance, accounts]);

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