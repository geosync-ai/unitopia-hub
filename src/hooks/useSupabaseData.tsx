import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import unitService from '@/integrations/supabase/unitService';
import { 
  tasksService, 
  projectsService, 
  risksService, 
  assetsService, 
  krasService 
} from '@/integrations/supabase/unitService';

// Define types for the different service methods
type FetchFunction = (userEmail?: string) => Promise<any[]>;
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
      const fetchedData = await fetchMethod(user.email);
      setData(fetchedData as T[]);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${entityType}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(`Failed to load ${entityType}`);
    } finally {
      setLoading(false);
    }
  }, [user?.email, entityType, getFetchMethod]);

  // Add a new item
  const add = useCallback(async (item: Omit<T, 'id'>) => {
    if (!user?.email) {
      toast.error('You must be logged in to add items');
      return null;
    }
    
    try {
      const addMethod = getAddMethod();
      const newItem = await addMethod(item);
      
      if (newItem) {
        setData(prev => [...prev, newItem as unknown as T]);
        toast.success(`${entityType.slice(0, -1)} added successfully`);
      }
      
      return newItem;
    } catch (err) {
      console.error(`Error adding ${entityType.slice(0, -1)}:`, err);
      toast.error(`Failed to add ${entityType.slice(0, -1)}`);
      return null;
    }
  }, [user?.email, entityType, getAddMethod]);

  // Update an item
  const update = useCallback(async (id: string, updateData: Partial<T>) => {
    if (!user?.email) {
      toast.error('You must be logged in to update items');
      return null;
    }
    
    try {
      const updateMethod = getUpdateMethod();
      const updatedItem = await updateMethod(id, updateData);
      
      if (updatedItem) {
        setData(prev => prev.map(item => 
          item.id === id ? { ...item, ...updatedItem } as T : item
        ));
        toast.success(`${entityType.slice(0, -1)} updated successfully`);
      }
      
      return updatedItem;
    } catch (err) {
      console.error(`Error updating ${entityType.slice(0, -1)}:`, err);
      toast.error(`Failed to update ${entityType.slice(0, -1)}`);
      return null;
    }
  }, [user?.email, entityType, getUpdateMethod]);

  // Delete an item
  const remove = useCallback(async (id: string) => {
    if (!user?.email) {
      toast.error('You must be logged in to delete items');
      return false;
    }
    
    try {
      const deleteMethod = getDeleteMethod();
      await deleteMethod(id);
      
      setData(prev => prev.filter(item => item.id !== id));
      toast.success(`${entityType.slice(0, -1)} deleted successfully`);
      
      return true;
    } catch (err) {
      console.error(`Error deleting ${entityType.slice(0, -1)}:`, err);
      toast.error(`Failed to delete ${entityType.slice(0, -1)}`);
      return false;
    }
  }, [user?.email, entityType, getDeleteMethod]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user?.email) {
      fetchData();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [user?.email, fetchData]);

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