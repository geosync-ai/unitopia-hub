import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';
import { 
  tasksService, 
  projectsService, 
  risksService, 
  assetsService, 
  krasService 
} from '@/integrations/supabase/unitService';
import { useDivisionContext } from './useDivisionContext';

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
  const { user } = useAuth();
  const { currentDivisionId } = useDivisionContext();

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
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const fetchMethod = getFetchMethod();
      const fetchedData = await fetchMethod(user.email, currentDivisionId || undefined);
      setData(fetchedData as T[]);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${entityType}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Don't show toast error as it can be disruptive
      // Still set empty data array so UI can render
      setData([]);
      
      // Log the specific error to console for debugging
      if (err && typeof err === 'object' && 'code' in err) {
        console.log(`Database error [${(err as any).code}]: ${(err as any).message}`);
        
        // Special handling for common errors
        if ((err as any).code === '42703') { // Column does not exist
          console.log('Column name mismatch. Check camelCase vs snake_case in queries.');
        } else if ((err as any).code === '42P01') { // Table does not exist 
          console.log('Table does not exist. Ensure you\'ve created the required tables in Supabase.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user?.email, entityType, getFetchMethod, currentDivisionId]);

  // Add a new item
  const add = useCallback(async (item: Omit<T, 'id'>) => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to add items"
      });
      return null;
    }
    
    try {
      // Conditionally add division ID to the item
      let itemWithDivision: any = { ...item };
      if (currentDivisionId) {
        // Only add divisionId if the context provides one.
        // We assume the specific service (e.g., projectsService.addProject) 
        // expects a field named 'divisionId' or handles its absence.
        itemWithDivision.divisionId = currentDivisionId;
      }

      console.log(`[useSupabaseData - add ${entityType}] Data before sending:`, 
        JSON.stringify(itemWithDivision, null, 2)
      );
      
      const addMethod = getAddMethod();
      const newItem = await addMethod(itemWithDivision);
      
      if (newItem) {
        setData(prev => [...prev, newItem as unknown as T]);
        toast({
          title: "Success",
          description: `${entityType.slice(0, -1)} added successfully`
        });
      }
      
      return newItem;
    } catch (err) {
      console.error(`Error adding ${entityType.slice(0, -1)}:`, err);
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
  }, [user?.email, entityType, getAddMethod, currentDivisionId]);

  // Update an item
  const update = useCallback(async (id: string, updateData: Partial<T>) => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to update items"
      });
      return null;
    }
    
    try {
      const updateMethod = getUpdateMethod();
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
      console.error(`Error updating ${entityType.slice(0, -1)}:`, err);
      toast({
        title: "Error",
        description: `Failed to update ${entityType.slice(0, -1)}`,
        variant: "destructive"
      });
      return null;
    }
  }, [user?.email, entityType, getUpdateMethod]);

  // Delete an item
  const remove = useCallback(async (id: string) => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to delete items"
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
      console.error(`Error deleting ${entityType.slice(0, -1)}:`, err);
      toast({
        title: "Error",
        description: `Failed to delete ${entityType.slice(0, -1)}`,
        variant: "destructive"
      });
      return false;
    }
  }, [user?.email, entityType, getDeleteMethod]);

  // Load data on mount and when user or division changes
  useEffect(() => {
    if (user?.email) {
      fetchData();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [user?.email, fetchData, currentDivisionId]);

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    refresh: fetchData
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