import { useState, useEffect, useCallback } from 'react';
import { useCsvSync, CsvSyncConfig } from './useCsvSync';
import { toast } from '@/components/ui/use-toast';

// Generic type for entity data
type EntityData<T> = {
  data: T[];
  isLoading: boolean;
  error: string | null;
  add: (item: Omit<T, 'id'>) => void;
  edit: (id: string, updatedItem: Partial<T>) => void;
  remove: (id: string) => void;
  refresh: () => Promise<void>;
};

export function useCsvEntityData<T extends { id: string }>(
  entityType: 'tasks' | 'projects' | 'risks' | 'assets' | 'objectives' | 'kras' | 'kpis',
  csvConfig: CsvSyncConfig | null,
  onCsvConfigChange: (config: CsvSyncConfig) => void,
  isSetupComplete: boolean
): EntityData<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize CSV sync
  const { loadDataFromCsv, saveDataToCsv, updateEntityData, isLoading: csvLoading, error: csvError } = useCsvSync({
    config: csvConfig,
    onConfigChange: onCsvConfigChange,
    isSetupComplete
  });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!isSetupComplete) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if we need to load from localStorage
        const storageType = localStorage.getItem('unitopia_storage_type');
        
        if (storageType === 'local') {
          // Load from localStorage
          const localData = localStorage.getItem(`unitopia_${entityType}`);
          if (localData) {
            const parsedData = JSON.parse(localData);
            setData(parsedData);
          } else {
            setData([]);
          }
        } else if (csvConfig) {
          // Load from CSV file
          const result = await loadDataFromCsv(entityType);
          if (result && result.data) {
            setData(result.data as T[]);
          }
        }
      } catch (err) {
        console.error(`Error loading ${entityType} data:`, err);
        setError(`Failed to load ${entityType} data: ${err.message}`);
        
        // Try to load from localStorage as fallback
        const localData = localStorage.getItem(`unitopia_${entityType}`);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            setData(parsedData);
            toast({
              title: "Using local data",
              description: `Using locally stored ${entityType} data as fallback.`,
              variant: "default",
            });
          } catch (localErr) {
            console.error(`Error loading local ${entityType} data:`, localErr);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [entityType, csvConfig, loadDataFromCsv, isSetupComplete]);

  // Sync CSV and localStorage errors
  useEffect(() => {
    if (csvError) {
      setError(csvError);
    }
  }, [csvError]);

  // Sync CSV loading state
  useEffect(() => {
    setIsLoading(csvLoading);
  }, [csvLoading]);

  // Add a new item
  const add = useCallback((item: Omit<T, 'id'>) => {
    const newItem = {
      ...item,
      id: `${entityType}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as T;

    setData(prev => [...prev, newItem]);

    // Save to the appropriate storage
    const storageType = localStorage.getItem('unitopia_storage_type');
    if (storageType === 'local') {
      const updatedData = [...data, newItem];
      localStorage.setItem(`unitopia_${entityType}`, JSON.stringify(updatedData));
    } else if (csvConfig) {
      updateEntityData(entityType, [...data, newItem]);
    }

    toast({
      title: "Added Successfully",
      description: `The ${entityType.slice(0, -1)} was added successfully.`,
    });
  }, [data, entityType, csvConfig, updateEntityData]);

  // Edit an existing item
  const edit = useCallback((id: string, updatedItem: Partial<T>) => {
    const updatedData = data.map(item => 
      item.id === id 
        ? { ...item, ...updatedItem, updatedAt: new Date().toISOString() } 
        : item
    );

    setData(updatedData);

    // Save to the appropriate storage
    const storageType = localStorage.getItem('unitopia_storage_type');
    if (storageType === 'local') {
      localStorage.setItem(`unitopia_${entityType}`, JSON.stringify(updatedData));
    } else if (csvConfig) {
      updateEntityData(entityType, updatedData);
    }

    toast({
      title: "Updated Successfully",
      description: `The ${entityType.slice(0, -1)} was updated successfully.`,
    });
  }, [data, entityType, csvConfig, updateEntityData]);

  // Remove an item
  const remove = useCallback((id: string) => {
    const updatedData = data.filter(item => item.id !== id);

    setData(updatedData);

    // Save to the appropriate storage
    const storageType = localStorage.getItem('unitopia_storage_type');
    if (storageType === 'local') {
      localStorage.setItem(`unitopia_${entityType}`, JSON.stringify(updatedData));
    } else if (csvConfig) {
      updateEntityData(entityType, updatedData);
    }

    toast({
      title: "Removed Successfully",
      description: `The ${entityType.slice(0, -1)} was removed successfully.`,
    });
  }, [data, entityType, csvConfig, updateEntityData]);

  // Refresh data
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storageType = localStorage.getItem('unitopia_storage_type');
      
      if (storageType === 'local') {
        // Load from localStorage
        const localData = localStorage.getItem(`unitopia_${entityType}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          setData(parsedData);
        }
      } else if (csvConfig) {
        // Load from CSV file
        const result = await loadDataFromCsv(entityType);
        if (result && result.data) {
          setData(result.data as T[]);
        }
      }
    } catch (err) {
      console.error(`Error refreshing ${entityType} data:`, err);
      setError(`Failed to refresh ${entityType} data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, csvConfig, loadDataFromCsv]);

  return {
    data,
    isLoading,
    error,
    add,
    edit,
    remove,
    refresh
  };
} 