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
        console.log(`[${entityType}] Setup not complete, skipping data load`);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log(`[${entityType}] Starting to fetch data`);

        // Check if we need to load from localStorage
        const storageType = localStorage.getItem('unitopia_storage_type');
        console.log(`[${entityType}] Storage type:`, storageType);
        
        if (storageType === 'local') {
          // Load from localStorage
          console.log(`[${entityType}] Loading from localStorage`);
          const localData = localStorage.getItem(`unitopia_${entityType}`);
          if (localData) {
            console.log(`[${entityType}] Found local data:`, localData.slice(0, 100) + '...');
            const parsedData = JSON.parse(localData);
            setData(parsedData);
            console.log(`[${entityType}] Loaded ${parsedData.length} items from localStorage`);
          } else {
            console.log(`[${entityType}] No local data found, setting empty array`);
            setData([]);
          }
        } else if (csvConfig) {
          // Load from CSV file
          console.log(`[${entityType}] Loading from CSV file`);
          console.log(`[${entityType}] CSV Config:`, JSON.stringify(csvConfig, null, 2));
          
          try {
            // Call loadDataFromCsv (note: this loads ALL entity data, not just this entity type)
            await loadDataFromCsv();

            // Since loadDataFromCsv updated the config with all data, we can now access our entity's data
            if (csvConfig && csvConfig.data && csvConfig.data[entityType]) {
              const entityData = csvConfig.data[entityType].rows;
              console.log(`[${entityType}] Got data from CSV config:`, entityData?.length || 0);
              
              if (entityData && Array.isArray(entityData)) {
                setData(entityData as T[]);
                console.log(`[${entityType}] Loaded ${entityData.length} items from CSV`);
              } else {
                console.log(`[${entityType}] No data in CSV, setting empty array`);
                setData([]);
              }
            } else {
              console.log(`[${entityType}] No data for this entity type in CSV config, setting empty array`);
              setData([]);
            }
          } catch (csvErr) {
            console.error(`[${entityType}] Error loading from CSV:`, csvErr);
            throw csvErr; // Rethrow to be caught by the outer catch block
          }
        } else {
          console.warn(`[${entityType}] No storage type defined and no CSV config, cannot load data`);
          setData([]);
        }
      } catch (err) {
        console.error(`[${entityType}] Error loading data:`, err);
        setError(`Failed to load ${entityType} data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        // Try to load from localStorage as fallback
        console.log(`[${entityType}] Trying localStorage as fallback`);
        const localData = localStorage.getItem(`unitopia_${entityType}`);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            setData(parsedData);
            console.log(`[${entityType}] Successfully loaded ${parsedData.length} items from localStorage fallback`);
            toast({
              title: "Using local data",
              description: `Using locally stored ${entityType} data as fallback.`,
              variant: "default",
            });
          } catch (localErr) {
            console.error(`[${entityType}] Error loading local data:`, localErr);
          }
        } else {
          console.log(`[${entityType}] No local fallback data found`);
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
    };

    // Type cast to T to fix the type issue
    const typedNewItem = newItem as unknown as T;
    
    setData(prev => [...prev, typedNewItem]);

    // Save to the appropriate storage
    const storageType = localStorage.getItem('unitopia_storage_type');
    if (storageType === 'local') {
      const updatedData = [...data, typedNewItem];
      localStorage.setItem(`unitopia_${entityType}`, JSON.stringify(updatedData));
    } else if (csvConfig) {
      updateEntityData(entityType, [...data, typedNewItem]);
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
        await loadDataFromCsv();
        
        // Since loadDataFromCsv updated the config with all data, we can now access our entity's data
        if (csvConfig && csvConfig.data && csvConfig.data[entityType]) {
          const entityData = csvConfig.data[entityType].rows;
          if (entityData && Array.isArray(entityData)) {
            setData(entityData as T[]);
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.error(`Error refreshing ${entityType} data:`, err);
      setError(`Failed to refresh ${entityType} data: ${err instanceof Error ? err.message : 'Unknown error'}`);
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