import { useState, useEffect, useCallback } from 'react';
import { useMicrosoftGraph } from './useMicrosoftGraph';
import { toast } from 'sonner';

export interface CsvSyncConfig {
  folderId: string;
  fileNames: {
    [key: string]: string; // key: sheet name, value: file name (e.g., "objectives.csv")
  };
  fileIds: {
    [key: string]: string; // key: sheet name, value: file id
  };
  data: {
    [key: string]: {
      headers: string[];
      rows: any[];
    };
  };
}

export interface UseCsvSyncProps {
  config: CsvSyncConfig | null;
  onConfigChange: (config: CsvSyncConfig) => void;
  isSetupComplete: boolean;
}

export const useCsvSync = ({ config, onConfigChange, isSetupComplete }: UseCsvSyncProps) => {
  const { createCsvFile, readCsvFile, updateCsvFile } = useMicrosoftGraph();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);

  // Initialize CSV files if they don't exist
  const initializeCsvFiles = useCallback(async () => {
    if (!config) {
      console.error('[CSV INIT] Cannot initialize CSV files: Missing configuration');
      return;
    }

    if (!config.folderId) {
      console.error('[CSV INIT] Cannot initialize CSV files: No folder ID specified');
      return;
    }

    // Skip if we already have file IDs or have already attempted initialization
    if (config.fileIds && Object.keys(config.fileIds).length > 0) {
      console.log('[CSV INIT] Files already initialized, skipping');
      return;
    }

    if (hasAttemptedInit) {
      console.log('[CSV INIT] Initialization already attempted, skipping');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if we've already attempted to create files in this session
      const sessionKey = `csv_init_attempt_${config.folderId}`;
      const hasAttemptedInSession = sessionStorage.getItem(sessionKey);
      
      if (hasAttemptedInSession) {
        console.log('[CSV INIT] CSV file creation already attempted in this session, skipping');
        setHasAttemptedInit(true);
        return;
      }
      
      console.log('[CSV INIT] Starting CSV file creation in folder:', config.folderId);
      
      // Set up default file names if not already defined
      if (!config.fileNames || Object.keys(config.fileNames).length === 0) {
        console.log('[CSV INIT] No file names defined, setting defaults');
        config.fileNames = {
          objectives: 'objectives.csv',
          kras: 'kras.csv',
          kpis: 'kpis.csv'
        };
      }
      
      console.log('[CSV INIT] Files to create:', Object.entries(config.fileNames).map(([key, name]) => `${key}: ${name}`).join(', '));
      
      const fileIds: { [key: string]: string } = {};
      let successCount = 0;
      let failCount = 0;
      
      // Create each CSV file one by one (not in parallel) to avoid rate limiting
      for (const [key, fileName] of Object.entries(config.fileNames)) {
        try {
          console.log(`[CSV INIT] Creating CSV file: ${fileName} for ${key}`);
          
          // Prepare content - headers as first line
          const headers = config.data[key]?.headers || [];
          if (headers.length === 0) {
            console.warn(`[CSV INIT] No headers defined for ${key}, using defaults`);
            
            // Set default headers based on entity type
            if (key === 'objectives') {
              headers.push('id', 'name', 'description', 'startDate', 'endDate', 'createdAt', 'updatedAt');
            } else if (key === 'kras') {
              headers.push('id', 'name', 'department', 'responsible', 'objectiveId', 'objectiveName', 'startDate', 'endDate', 'status', 'createdAt', 'updatedAt');
            } else if (key === 'kpis') {
              headers.push('id', 'name', 'kraId', 'kraName', 'target', 'actual', 'status', 'startDate', 'date', 'createdAt', 'updatedAt');
            }
          }
          
          const initialContent = headers.join(',');
          console.log(`[CSV INIT] Prepared headers for ${fileName}: ${initialContent}`);
          
          // Create empty CSV file with headers
          console.log(`[CSV INIT] Calling createCsvFile for ${fileName} with folder ID ${config.folderId}`);
          const csvFile = await createCsvFile(
            fileName,
            initialContent,
            config.folderId
          );
          
          if (csvFile && csvFile.id) {
            console.log(`[CSV INIT] CSV file created: ${fileName} with ID: ${csvFile.id}`);
            fileIds[key] = csvFile.id;
            successCount++;
          } else {
            console.error(`[CSV INIT] Failed to create CSV file: ${fileName} - No valid ID returned`);
            failCount++;
          }
        } catch (fileError) {
          console.error(`[CSV INIT] Error creating CSV file ${fileName}:`, fileError);
          failCount++;
        }
        
        // Brief pause between file creations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Update the config with the file IDs if we have at least one successful file
      if (Object.keys(fileIds).length > 0) {
        console.log(`[CSV INIT] Updating config with ${Object.keys(fileIds).length} file IDs`);
        const updatedConfig = {
          ...config,
          fileIds
        };
        
        onConfigChange(updatedConfig);
        
        // Mark that we've attempted initialization in this session
        sessionStorage.setItem(sessionKey, 'true');
        
        toast.success(`CSV files created successfully (${successCount} of ${Object.keys(config.fileNames).length})`);
      } else {
        console.error('[CSV INIT] Failed to create any CSV files');
        toast.error('Failed to create CSV files in OneDrive');
      }
      
      console.log(`[CSV INIT] CSV initialization complete. Success: ${successCount}, Failed: ${failCount}`);
    } catch (err) {
      console.error('[CSV INIT] Error initializing CSV files:', err);
      setError('Failed to initialize CSV files');
      toast.error(`Failed to initialize CSV files: ${err.message || 'Unknown error'}`);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false);
      setHasAttemptedInit(true);
    }
  }, [config, createCsvFile, onConfigChange, hasAttemptedInit, toast]);

  // Load data from CSV files
  const loadDataFromCsv = useCallback(async () => {
    if (!config || Object.keys(config.fileIds || {}).length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedData: { [key: string]: { headers: string[]; rows: any[] } } = {};

      // Load data from each CSV file
      for (const [key, fileId] of Object.entries(config.fileIds)) {
        if (!fileId) continue;
        
        console.log(`Loading data from CSV file: ${config.fileNames[key]} (${fileId})`);
        
        const csvContent = await readCsvFile(fileId);
        
        if (!csvContent || csvContent.trim() === '') {
          // If file is empty, initialize with headers
          updatedData[key] = {
            headers: config.data[key]?.headers || [],
            rows: []
          };
          continue;
        }
        
        // Parse CSV content
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          updatedData[key] = {
            headers: config.data[key]?.headers || [],
            rows: []
          };
          continue;
        }
        
        // First line is headers
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Rest are data rows
        const rows = lines.slice(1).map(line => {
          const values = parseCsvLine(line);
          const row: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          return row;
        });
        
        updatedData[key] = {
          headers,
          rows
        };
      }

      // Update the config with the loaded data
      onConfigChange({
        ...config,
        data: {
          ...config.data,
          ...updatedData
        }
      });

      toast.success('Data loaded from CSV successfully');
    } catch (err) {
      console.error('Error loading data from CSV:', err);
      setError('Failed to load data from CSV');
      toast.error('Failed to load data from CSV');
    } finally {
      setIsLoading(false);
    }
  }, [config, readCsvFile, onConfigChange]);

  // Parse a CSV line handling quoted values correctly
  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Toggle quote state
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue);
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue);
    
    return values;
  };

  // Save data to CSV files
  const saveDataToCsv = useCallback(async () => {
    if (!config) {
      console.error('Cannot save data to CSV: Missing config');
      toast.error('Failed to save data: CSV configuration is missing');
      return;
    }

    if (!config.fileIds || Object.keys(config.fileIds).length === 0) {
      console.error('Cannot save data to CSV: No file IDs available', config);
      toast.error('Failed to save data: CSV files not properly initialized');
      
      // Try to reinitialize files if they're missing
      await initializeCsvFiles();
      return;
    }

    // Check if we're using local storage mode (file IDs starting with "local-")
    const isLocalStorage = Object.values(config.fileIds).some(id => id.startsWith('local-'));
    
    if (isLocalStorage) {
      console.log('[CSV SAVE] Detected local storage mode, saving to localStorage instead of OneDrive');
      return await saveDataToLocalStorage();
    }
    
    // If we have a folder ID, we should be using OneDrive
    if (!config.folderId) {
      console.error('Cannot save data to CSV: No folder ID specified', config);
      toast.error('Failed to save data: No OneDrive folder selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the current timestamp for logging
      const saveTimestamp = new Date().toISOString();
      console.log(`[CSV SAVE] Starting save operation at ${saveTimestamp}`, {
        folderId: config.folderId,
        fileIdsCount: Object.keys(config.fileIds).length,
        fileNames: Object.keys(config.fileNames || {}).join(', '),
        fileIds: JSON.stringify(config.fileIds)
      });
      
      // Keep track of successful files
      const successfulFiles = [];
      const failedFiles = [];
      const fileContents = {};
      
      // Validate file IDs before proceeding
      const validFileIds = Object.entries(config.fileIds).filter(([key, id]) => {
        // Skip local storage file IDs when trying to save to OneDrive
        if (id.startsWith('local-')) {
          console.warn(`[CSV SAVE] Skipping local file for ${key}: ${id}`);
          failedFiles.push(key);
          return false;
        }
        
        if (!id || id.trim() === '') {
          console.warn(`[CSV SAVE] Skipping CSV file for ${key}: Empty file ID`);
          failedFiles.push(key);
          return false;
        }
        return true;
      });
      
      console.log(`[CSV SAVE] Found ${validFileIds.length} valid file IDs for saving to OneDrive`);
      
      // Save data to each CSV file
      for (const [key, fileId] of validFileIds) {
        const { headers, rows } = config.data[key] || { headers: [], rows: [] };
        
        console.log(`[CSV SAVE] Processing file: ${config.fileNames[key]} (ID: ${fileId})`);
        console.log(`[CSV SAVE] File has ${rows.length} rows and ${headers.length} headers`);
        
        // Skip files with no headers
        if (!headers || headers.length === 0) {
          console.warn(`[CSV SAVE] Skipping file ${config.fileNames[key]}: No headers defined`);
          failedFiles.push(key);
          continue;
        }
        
        // Add metadata comment at the top of the file
        const csvLines = [
          `# Last updated: ${saveTimestamp}`,
          headers.join(',')
        ];
        
        // Add data rows
        rows.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            
            // Handle values that might need quotes (contain commas or quotes)
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              // Escape quotes by doubling them and wrap in quotes
              return `"${value.replace(/"/g, '""')}"`;
            }
            
            return value === null || value === undefined ? '' : String(value);
          });
          
          csvLines.push(values.join(','));
        });
        
        const csvContent = csvLines.join('\n');
        fileContents[key] = csvContent; // Store content for logging
        
        console.log(`[CSV SAVE] Prepared content for ${config.fileNames[key]}: ${csvLines.length} lines, ${csvContent.length} bytes`);
        console.log(`[CSV SAVE] First 200 characters: ${csvContent.substring(0, 200)}...`);
        
        try {
          // Update CSV file with a retry mechanism
          let success = false;
          let attempt = 1;
          const maxAttempts = 3;
          
          while (!success && attempt <= maxAttempts) {
            try {
              console.log(`[CSV SAVE] Attempt ${attempt}/${maxAttempts} for ${config.fileNames[key]}`);
              
              // Update CSV file
              const updateResult = await updateCsvFile(fileId, csvContent);
              
              if (updateResult) {
                success = true;
                console.log(`[CSV SAVE] Successfully saved ${config.fileNames[key]} on attempt ${attempt}`);
                successfulFiles.push(key);
              } else {
                throw new Error('Update returned false');
              }
            } catch (fileError) {
              console.error(`[CSV SAVE] Error saving ${config.fileNames[key]} (attempt ${attempt}/${maxAttempts}):`, fileError);
              
              if (attempt === maxAttempts) {
                failedFiles.push(key);
                throw fileError; // Re-throw on final attempt
              }
              
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              attempt++;
            }
          }
        } catch (fileError) {
          const maxAttempts = 3;
          console.error(`[CSV SAVE] Failed to save ${config.fileNames[key]} after ${maxAttempts} attempts:`, fileError);
          // Continue with other files rather than failing completely
        }
      }
      
      // Summary logging
      console.log(`[CSV SAVE] Save operation complete at ${new Date().toISOString()}`);
      console.log(`[CSV SAVE] Results: ${successfulFiles.length} files saved, ${failedFiles.length} files failed`);
      console.log(`[CSV SAVE] Successful files: ${successfulFiles.map(key => config.fileNames[key]).join(', ')}`);
      
      if (failedFiles.length > 0) {
        console.warn(`[CSV SAVE] Failed files: ${failedFiles.map(key => config.fileNames[key]).join(', ')}`);
        toast.warning(`${successfulFiles.length} files saved successfully, but ${failedFiles.length} files failed.`);
      } else if (successfulFiles.length > 0) {
        toast.success(`All data saved to OneDrive folder successfully (${successfulFiles.length} files)`);
      } else {
        toast.error('No CSV files were successfully saved');
      }
    } catch (err) {
      console.error('[CSV SAVE] Fatal error saving data to CSV:', err);
      setError('Failed to save data to CSV');
      toast.error('Failed to save data to CSV: ' + (err.message || 'Unknown error'));
      throw err; // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false);
    }
  }, [config, updateCsvFile, initializeCsvFiles, toast]);

  // New function to save data to localStorage when using local mode
  const saveDataToLocalStorage = useCallback(async () => {
    if (!config) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[CSV SAVE] Saving data to localStorage');
      const timestamp = new Date().toISOString();
      
      // Keep track of successful files
      const successfulFiles = [];
      const failedFiles = [];
      
      // Process each entity type
      for (const [key, fileName] of Object.entries(config.fileNames || {})) {
        try {
          const { headers, rows } = config.data[key] || { headers: [], rows: [] };
          
          console.log(`[CSV SAVE] Processing local file: ${fileName}`);
          console.log(`[CSV SAVE] File has ${rows.length} rows and ${headers.length} headers`);
          
          // Skip files with no headers
          if (!headers || headers.length === 0) {
            console.warn(`[CSV SAVE] Skipping local file ${fileName}: No headers defined`);
            failedFiles.push(key);
            continue;
          }
          
          // Format as CSV content
          const csvLines = [
            `# Last updated: ${timestamp}`,
            headers.join(',')
          ];
          
          // Add data rows
          rows.forEach(row => {
            const values = headers.map(header => {
              const value = row[header];
              
              // Handle values that might need quotes
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              
              return value === null || value === undefined ? '' : String(value);
            });
            
            csvLines.push(values.join(','));
          });
          
          const csvContent = csvLines.join('\n');
          
          // Save CSV content to localStorage
          const storageKey = `unitopia_csv_${key}`;
          localStorage.setItem(storageKey, csvContent);
          
          // Also save the structured data for easy access
          try {
            localStorage.setItem(`unitopia_${key}`, JSON.stringify(rows));
          } catch (e) {
            console.warn(`[CSV SAVE] Could not save JSON data for ${key}:`, e);
          }
          
          console.log(`[CSV SAVE] Successfully saved ${fileName} to localStorage`);
          successfulFiles.push(key);
        } catch (error) {
          console.error(`[CSV SAVE] Failed to save ${fileName} to localStorage:`, error);
          failedFiles.push(key);
        }
      }
      
      // Summary logging
      console.log(`[CSV SAVE] Local storage save complete at ${new Date().toISOString()}`);
      console.log(`[CSV SAVE] Results: ${successfulFiles.length} files saved, ${failedFiles.length} files failed`);
      
      if (failedFiles.length > 0) {
        console.warn(`[CSV SAVE] Failed local files: ${failedFiles.map(key => config.fileNames[key]).join(', ')}`);
        toast.warning(`${successfulFiles.length} files saved to local storage, but ${failedFiles.length} failed.`);
      } else if (successfulFiles.length > 0) {
        toast.success(`All data saved to local storage successfully (${successfulFiles.length} files)`);
      } else {
        toast.error('No files were successfully saved to local storage');
      }
      
      return true;
    } catch (err) {
      console.error('[CSV SAVE] Error saving to localStorage:', err);
      setError('Failed to save data to localStorage');
      toast.error('Failed to save data locally: ' + (err.message || 'Unknown error'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [config, toast]);

  // Update data for a specific entity type
  const updateEntityData = useCallback((entityType: string, data: any[]) => {
    if (!config) return;

    // Get current timestamp for updates
    const currentTimestamp = new Date().toISOString();

    // Add timestamps to the data
    const updatedData = data.map(item => ({
      ...item,
      updatedAt: currentTimestamp,
      createdAt: item.createdAt || currentTimestamp
    }));

    const newConfigData = {
      ...config.data,
      [entityType]: {
        headers: config.data[entityType]?.headers || [],
        rows: updatedData
      }
    };

    onConfigChange({
      ...config,
      data: newConfigData
    });
  }, [config, onConfigChange]);

  // Initialize CSV files on mount if needed
  useEffect(() => {
    if (!isSetupComplete && config && Object.keys(config.fileIds || {}).length === 0 && !hasAttemptedInit) {
      initializeCsvFiles();
    }
  }, [config, initializeCsvFiles, hasAttemptedInit, isSetupComplete]);

  return {
    isLoading,
    error,
    loadDataFromCsv,
    saveDataToCsv,
    updateEntityData
  };
}; 