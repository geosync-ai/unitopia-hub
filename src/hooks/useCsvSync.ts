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
    if (!config || Object.keys(config.fileIds || {}).length > 0 || hasAttemptedInit) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if we've already attempted to create files in this session
      const sessionKey = `csv_init_attempt_${config.folderId}`;
      const hasAttemptedInSession = sessionStorage.getItem(sessionKey);
      
      if (hasAttemptedInSession) {
        console.log('CSV file creation already attempted in this session, skipping');
        setHasAttemptedInit(true);
        return;
      }
      
      console.log('Creating CSV files in folder:', config.folderId);
      
      const fileIds: { [key: string]: string } = {};
      
      // Create each CSV file in parallel
      const createFilePromises = Object.entries(config.fileNames).map(async ([key, fileName]) => {
        console.log(`Creating CSV file: ${fileName}`);
        
        // Prepare content - headers as first line
        const headers = config.data[key]?.headers || [];
        
        // Create empty CSV file with headers
        const csvFile = await createCsvFile(
          fileName,
          headers.join(','),
          config.folderId
        );
        
        if (csvFile) {
          console.log(`CSV file created: ${fileName} with ID: ${csvFile.id}`);
          fileIds[key] = csvFile.id;
        } else {
          console.error(`Failed to create CSV file: ${fileName}`);
        }
      });
      
      await Promise.all(createFilePromises);
      
      // Update the config with the file IDs
      const updatedConfig = {
        ...config,
        fileIds
      };
      
      onConfigChange(updatedConfig);

      // Mark that we've attempted initialization in this session
      sessionStorage.setItem(sessionKey, 'true');

      toast.success('CSV files created successfully');
    } catch (err) {
      console.error('Error initializing CSV files:', err);
      setError('Failed to initialize CSV files');
      toast.error('Failed to initialize CSV files');
      throw err; // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false);
      setHasAttemptedInit(true);
    }
  }, [config, createCsvFile, onConfigChange, hasAttemptedInit]);

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
    if (!config || Object.keys(config.fileIds || {}).length === 0) {
      console.error('Cannot save data to CSV: Missing config or fileIds', { config });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the current timestamp for logging
      const saveTimestamp = new Date().toISOString();
      console.log(`Saving data to CSV files at ${saveTimestamp}`, {
        folderId: config.folderId,
        fileIdsCount: Object.keys(config.fileIds).length,
        fileNames: Object.keys(config.fileNames || {}).join(', ')
      });
      
      // Keep track of successful files
      const successfulFiles = [];
      const failedFiles = [];
      
      // Save data to each CSV file
      for (const [key, fileId] of Object.entries(config.fileIds)) {
        if (!fileId) {
          console.warn(`Skipping CSV file for ${key}: No file ID defined`);
          failedFiles.push(key);
          continue;
        }
        
        const { headers, rows } = config.data[key] || { headers: [], rows: [] };
        
        console.log(`Processing CSV file: ${config.fileNames[key]} (${fileId}) with ${rows.length} rows and ${headers.length} headers`);
        
        // Skip files with no headers
        if (!headers || headers.length === 0) {
          console.warn(`Skipping CSV file ${config.fileNames[key]}: No headers defined`);
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
        
        console.log(`Preparing to update CSV file: ${config.fileNames[key]} with ${csvLines.length} lines (${csvContent.length} bytes)`);
        
        try {
          // Update CSV file with a retry mechanism
          let success = false;
          let attempt = 1;
          const maxAttempts = 3;
          
          while (!success && attempt <= maxAttempts) {
            try {
              console.log(`Attempt ${attempt}/${maxAttempts} to update CSV file: ${config.fileNames[key]}`);
              // Update CSV file
              await updateCsvFile(fileId, csvContent);
              success = true;
              console.log(`Successfully updated CSV file: ${config.fileNames[key]} on attempt ${attempt}`);
              successfulFiles.push(key);
            } catch (fileError) {
              console.error(`Error updating CSV file ${config.fileNames[key]} on attempt ${attempt}:`, fileError);
              
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
          const maxAttempts = 3; // Add the constant here too for the error message
          console.error(`Error updating CSV file ${config.fileNames[key]} after ${maxAttempts} attempts:`, fileError);
          // Continue with other files rather than failing completely
        }
      }
      
      // Summary logging
      console.log(`CSV sync complete. Success: ${successfulFiles.length}, Failed: ${failedFiles.length}`);
      console.log(`Successful files: ${successfulFiles.join(', ')}`);
      
      if (failedFiles.length > 0) {
        console.warn(`Failed files: ${failedFiles.join(', ')}`);
        toast.warning(`${successfulFiles.length} files saved successfully, but ${failedFiles.length} files failed.`);
      } else if (successfulFiles.length > 0) {
        toast.success('All data saved to CSV successfully');
      } else {
        toast.error('No CSV files were successfully saved');
      }
    } catch (err) {
      console.error('Error saving data to CSV:', err);
      setError('Failed to save data to CSV');
      toast.error('Failed to save data to CSV');
      throw err; // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false);
    }
  }, [config, updateCsvFile]);

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