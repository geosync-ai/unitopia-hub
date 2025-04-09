import { useState, useEffect, useCallback } from 'react';
import { useMicrosoftGraph } from './useMicrosoftGraph';
import { toast } from 'sonner';

export interface ExcelSyncConfig {
  folderId: string;
  fileName: string;
  fileId?: string;
  sheets: {
    [key: string]: {
      name: string;
      headers: string[];
      data: any[];
    };
  };
}

export interface UseExcelSyncProps {
  config: ExcelSyncConfig | null;
  onConfigChange: (config: ExcelSyncConfig) => void;
  isSetupComplete: boolean;
}

export const useExcelSync = ({ config, onConfigChange, isSetupComplete }: UseExcelSyncProps) => {
  const { createExcelFile, readExcelFile, updateExcelFile, getExcelSheets } = useMicrosoftGraph();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);

  // Initialize Excel file if it doesn't exist
  const initializeExcelFile = useCallback(async () => {
    if (!config || config.fileId || hasAttemptedInit) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if we've already attempted to create a file in this session
      const sessionKey = `excel_init_attempt_${config.folderId}_${config.fileName}`;
      const hasAttemptedInSession = sessionStorage.getItem(sessionKey);
      
      if (hasAttemptedInSession) {
        console.log('Excel file creation already attempted in this session, skipping');
        setHasAttemptedInit(true);
        return;
      }
      
      // Create a new Excel file
      const excelFile = await createExcelFile(config.fileName, config.folderId);
      
      if (!excelFile) {
        throw new Error('Failed to create Excel file');
      }

      // Update the config with the file ID
      onConfigChange({
        ...config,
        fileId: excelFile.id
      });

      // Mark that we've attempted initialization in this session
      sessionStorage.setItem(sessionKey, 'true');

      toast.success('Excel file created successfully');
    } catch (err) {
      console.error('Error initializing Excel file:', err);
      setError('Failed to initialize Excel file');
      toast.error('Failed to initialize Excel file');
    } finally {
      setIsLoading(false);
      setHasAttemptedInit(true);
    }
  }, [config, createExcelFile, onConfigChange, hasAttemptedInit]);

  // Load data from Excel file
  const loadDataFromExcel = useCallback(async () => {
    if (!config || !config.fileId) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedSheets: { [key: string]: any } = {};

      // Load data from each sheet
      for (const [key, sheet] of Object.entries(config.sheets)) {
        const data = await readExcelFile(config.fileId!, sheet.name, 'A1:Z1000');
        
        if (!data || data.length === 0) {
          // If sheet is empty, initialize it with headers
          await updateExcelFile(config.fileId!, sheet.name, 'A1', [sheet.headers]);
          updatedSheets[key] = {
            ...sheet,
            data: []
          };
        } else {
          // Parse data from Excel
          const headers = data[0];
          const rows = data.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          updatedSheets[key] = {
            ...sheet,
            data: rows
          };
        }
      }

      // Update the config with the loaded data
      onConfigChange({
        ...config,
        sheets: updatedSheets
      });

      toast.success('Data loaded from Excel successfully');
    } catch (err) {
      console.error('Error loading data from Excel:', err);
      setError('Failed to load data from Excel');
      toast.error('Failed to load data from Excel');
    } finally {
      setIsLoading(false);
    }
  }, [config, readExcelFile, updateExcelFile, onConfigChange]);

  // Save data to Excel file
  const saveDataToExcel = useCallback(async () => {
    if (!config || !config.fileId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Save data to each sheet
      for (const [key, sheet] of Object.entries(config.sheets)) {
        // Convert data to 2D array for Excel
        const excelData = [
          sheet.headers,
          ...sheet.data.map(item => 
            sheet.headers.map(header => item[header] || '')
          )
        ];

        // Update Excel file
        await updateExcelFile(config.fileId!, sheet.name, 'A1', excelData);
      }

      toast.success('Data saved to Excel successfully');
    } catch (err) {
      console.error('Error saving data to Excel:', err);
      setError('Failed to save data to Excel');
      toast.error('Failed to save data to Excel');
    } finally {
      setIsLoading(false);
    }
  }, [config, updateExcelFile]);

  // Update data in a specific sheet
  const updateSheetData = useCallback((sheetKey: string, data: any[]) => {
    if (!config) return;

    const updatedSheets = {
      ...config.sheets,
      [sheetKey]: {
        ...config.sheets[sheetKey],
        data
      }
    };

    onConfigChange({
      ...config,
      sheets: updatedSheets
    });
  }, [config, onConfigChange]);

  // Initialize Excel file on mount if needed
  useEffect(() => {
    if (!isSetupComplete && config && !config.fileId && !hasAttemptedInit) {
      initializeExcelFile();
    }
  }, [config, initializeExcelFile, hasAttemptedInit, isSetupComplete]);

  return {
    isLoading,
    error,
    loadDataFromExcel,
    saveDataToExcel,
    updateSheetData
  };
}; 