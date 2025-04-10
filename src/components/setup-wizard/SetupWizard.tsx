import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OneDriveSetup } from '@/components/setup-wizard/steps/OneDriveSetup';
import { SetupMethod } from '@/components/setup-wizard/steps/SetupMethod';
import { ObjectivesSetup } from '@/components/setup-wizard/steps/ObjectivesSetup';
import { KRASetup } from '@/components/setup-wizard/steps/KRASetup';
import { KPISetup } from '@/components/setup-wizard/steps/KPISetup';
import { SetupSummary } from '@/components/setup-wizard/steps/SetupSummary';
import { useToast } from '@/components/ui/use-toast';
import { useCsvSync } from '@/hooks/useCsvSync';
import { 
  Loader2, Cloud, FileText, Database, Check, AlertTriangle, 
  RefreshCw, FolderPlus, Edit, Trash2, Folder, ArrowUp, Image, 
  FileIcon, Home, ChevronLeft, FolderOpen, AlertCircle
} from 'lucide-react';
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMsal } from '@azure/msal-react';

// Add global style directly to head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes highlightFolder {
      0% { background-color: rgba(59, 130, 246, 0.1); }
      50% { background-color: rgba(59, 130, 246, 0.3); }
      100% { background-color: rgba(59, 130, 246, 0.1); }
    }
    .highlight-folder {
      animation: highlightFolder 2s ease;
    }
  `;
  document.head.appendChild(style);
}

// Extend Window interface for our global variables
declare global {
  interface Window {
    oneDriveFetchAttempts?: number;
    oneDriveToastShown?: boolean;
  }
}

// Define individual props needed from the setup state
interface SetupWizardSpecificProps {
  setSetupMethod: (method: string) => void;
  setOneDriveConfig: (config: { folderId: string; folderName: string; isTemporary?: boolean } | null) => void;
  setObjectives: (objectives: any[]) => void;
  setKRAs: (kras: any[]) => void;
  setKPIs: (kpis: any[]) => void;
  handleSetupCompleteFromHook: () => void; // Renamed to avoid conflict
  updateCsvConfig: () => void;
  csvConfig: any; // Consider stronger typing if possible
  oneDriveConfig: any; // Consider stronger typing if possible
  setupMethodProp?: string; // Pass if needed directly, or rely on internal state?
  objectivesProp?: any[]; // Pass if needed directly
  krasProp?: any[]; // Add KRAs prop
  kpisProp?: any[]; // Add this new prop
  isSetupComplete: boolean;
}

interface SetupWizardProps extends SetupWizardSpecificProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void; // Prop from parent for completion feedback
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  // Destructure individual props
  setSetupMethod,
  setOneDriveConfig,
  setObjectives,
  setKRAs,
  setKPIs,
  handleSetupCompleteFromHook,
  updateCsvConfig,
  csvConfig,
  oneDriveConfig,
  setupMethodProp, // Receive props
  objectivesProp,
  krasProp,
  kpisProp,
  isSetupComplete,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedSetupType, setSelectedSetupType] = useState<string | null>(null);
  const [tempObjectives, setTempObjectives] = useState<any[]>([]);
  const [tempKRAs, setTempKRAs] = useState<any[]>([]);
  const [tempKPIs, setTempKPIs] = useState<any[]>([]);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
  
  // Add the useMicrosoftGraph hook at the component level
  const { createCsvFile, isLoading: graphLoading } = useMicrosoftGraph();

  // Add type for createCsvFile to help with linter issues
  type CreateCsvFileType = (fileName: string, content: string, folderId: string) => Promise<any>;

  // Use the type to avoid linter errors
  const safeCreateCsvFile = createCsvFile as unknown as CreateCsvFileType;

  // Define steps for the wizard with the new KRA step
  const steps = [
    { id: 0, name: "Setup Method" },
    { id: 1, name: "Storage Location" },
    { id: 2, name: "Objectives" },
    { id: 3, name: "KRAs" },
    { id: 4, name: "KPIs" },
    { id: 5, name: "Summary" }
  ];

  // Updated total steps count
  const totalSteps = steps.length;

  // Use the CSV sync hook with props
  const { 
    isLoading: isCsvLoading, 
    error: csvError, 
    loadDataFromCsv, 
    saveDataToCsv 
  } = useCsvSync({
    config: csvConfig || null, // Use prop
    onConfigChange: updateCsvConfig || (() => {}), // Use prop
    isSetupComplete: isSetupComplete // Pass the prop here
  });

  // Initialize component
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setCurrentStep(0);
      setProgress(0);
      setIsProcessing(false);
      setSelectedSetupType(null);
      setTempObjectives([]);
      setTempKRAs([]);
      setTempKPIs([]);
      setSetupError(null);
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized]);

  // Reset initialization when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  // Update CSV config based on props
  useEffect(() => {
    // Only update CSV config if we have both oneDriveConfig and setupMethodProp
    // and we're not already processing
    if (oneDriveConfig && setupMethodProp && !isProcessing) {
      // Add a debounce to prevent multiple rapid updates
      const timeoutId = setTimeout(() => {
        updateCsvConfig();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [oneDriveConfig, setupMethodProp, updateCsvConfig, isProcessing]);

  // Function to update CSV configuration with new data
  const updateCsvConfigWithData = useCallback((newConfig?: any) => {
    // We need to update the csvConfig state in the parent component
    if (newConfig) {
      console.log('Updating CSV config with new data:', newConfig);
      
      // Create a deep copy of the current config
      const updatedConfig = JSON.parse(JSON.stringify(csvConfig || {}));
      
      // Update the fileIds if provided
      if (newConfig.fileIds) {
        updatedConfig.fileIds = {...(updatedConfig.fileIds || {}), ...newConfig.fileIds};
      }
      
      // Ensure data object exists
      if (!updatedConfig.data) {
        updatedConfig.data = {};
      }
      
      // Update each entity's data in the config
      if (newConfig.data) {
        Object.keys(newConfig.data).forEach(entityType => {
          const newEntityData = newConfig.data[entityType];
          
          if (!updatedConfig.data[entityType]) {
            // Create new entity data
            updatedConfig.data[entityType] = {
              headers: [...newEntityData.headers],
              rows: JSON.parse(JSON.stringify(newEntityData.rows))
            };
          } else {
            // Update existing entity data
            updatedConfig.data[entityType] = {
              headers: newEntityData.headers || updatedConfig.data[entityType].headers,
              rows: JSON.parse(JSON.stringify(newEntityData.rows || updatedConfig.data[entityType].rows))
            };
          }
        });
      }
      
      console.log('Updated CSV config:', updatedConfig);
      
      // Update the CSV config in the parent component
      if (updateCsvConfig) {
        // We need to find a way to update the config in the parent
        // For now, we'll use a workaround by directly modifying the csvConfig object
        Object.assign(csvConfig || {}, updatedConfig);
        
        // Call the updateCsvConfig function to trigger a re-render
        updateCsvConfig();
      }
    }
  }, [csvConfig, updateCsvConfig]);

  // Define handleComplete with KRAs support
  const handleComplete = useCallback(async () => {
    // Add more robust error handling
    try {
      if (!csvConfig && !isUsingLocalStorage) {
        toast({
          title: "Setup Error",
          description: "CSV configuration is not properly initialized. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      setIsProcessing(true);
      setProgress(10);
      
      // If we're using local storage, handle that flow
      if (isUsingLocalStorage) {
        try {
          console.log('Using local storage for unit data');
          setProgress(20);
          
          // Store in localStorage for persistence
          localStorage.setItem('unitopia_objectives', JSON.stringify(tempObjectives));
          localStorage.setItem('unitopia_kras', JSON.stringify(tempKRAs));
          localStorage.setItem('unitopia_kpis', JSON.stringify(tempKPIs));
          localStorage.setItem('unitopia_storage_type', 'local');
          
          setProgress(50);
          
          // Update the state in parent
          if (setObjectives) setObjectives(tempObjectives);
          if (setKRAs) setKRAs(tempKRAs);
          if (setKPIs) setKPIs(tempKPIs);
          
          // Complete setup
          setProgress(100);
          if (handleSetupCompleteFromHook) {
            handleSetupCompleteFromHook();
          }
          
          toast({ 
            title: "Setup Complete", 
            description: "Your unit data has been stored locally for this session." 
          });
          
          onComplete();
          onClose();
        } catch (error) {
          console.error('Error in local storage setup:', error);
          setSetupError(`Local storage error: ${error.message || 'Unknown error'}`);
          toast({
            title: "Setup Error",
            description: "Failed to save your data locally. Please try again.",
            variant: "destructive"
          });
          setIsProcessing(false);
        }
        return;
      }
      
      // Regular OneDrive setup continues here
      // Prepare data for CSV files
      setProgress(20);
      
      // Create a copy of the current config to update
      const updatedConfig = { ...csvConfig };
      
      // Ensure the data object and fileIds exist
      if (!updatedConfig.data) {
        updatedConfig.data = {};
      }
      
      if (!updatedConfig.fileIds) {
        updatedConfig.fileIds = {};
      }
      
      // Helper function to generate unique IDs
      const generateId = () => `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Prepare objectives data
      if (tempObjectives && tempObjectives.length > 0) {
        console.log('Preparing Objectives data:', tempObjectives);
        
        // Get current timestamp
        const currentTimestamp = new Date().toISOString();
        
        // Make sure all objectives have IDs
        const objectivesWithIds = tempObjectives.map(obj => ({
          ...obj,
          id: obj.id || generateId(),
          createdAt: obj.createdAt || currentTimestamp,
          updatedAt: currentTimestamp
        }));
        
        const objectivesHeaders = ['id', 'name', 'description', 'startDate', 'endDate', 'createdAt', 'updatedAt'];
        
        // Ensure we have an objectives entity in the data
        if (!updatedConfig.data.objectives) {
          updatedConfig.data.objectives = {
            headers: objectivesHeaders,
            rows: []
          };
        }
        
        // Update objectives data
        updatedConfig.data.objectives.rows = objectivesWithIds.map(obj => {
          const row: Record<string, string> = {};
          objectivesHeaders.forEach(header => {
            row[header] = obj[header] || '';
          });
          return row;
        });
        
        console.log('Prepared objectives data:', updatedConfig.data.objectives);
      }
      
      // Prepare KRAs data
      if (tempKRAs && tempKRAs.length > 0) {
        console.log('Preparing KRAs data:', tempKRAs);
        
        // Get current timestamp
        const currentTimestamp = new Date().toISOString();
        
        // Make sure all KRAs have IDs
        const krasWithIds = tempKRAs.map(kra => ({
          ...kra,
          id: kra.id || generateId(),
          createdAt: kra.createdAt || currentTimestamp,
          updatedAt: currentTimestamp
        }));
        
        const kraHeaders = ['id', 'name', 'department', 'responsible', 'startDate', 'endDate', 'objectiveId', 'objectiveName', 'createdAt', 'updatedAt'];
        
        // Ensure we have a KRAs entity in the data
        if (!updatedConfig.data.kras) {
          updatedConfig.data.kras = {
            headers: kraHeaders,
            rows: []
          };
        }
        
        // Update KRAs data
        updatedConfig.data.kras.rows = krasWithIds.map(kra => {
          const row: Record<string, string> = {};
          kraHeaders.forEach(header => {
            row[header] = kra[header] || '';
          });
          return row;
        });
        
        console.log('Prepared KRAs data:', updatedConfig.data.kras);
      }
      
      // Prepare KPIs data
      if (tempKPIs && tempKPIs.length > 0) {
        console.log('Preparing KPIs data:', tempKPIs);
        
        // Get current timestamp
        const currentTimestamp = new Date().toISOString();
        
        // Make sure all KPIs have IDs
        const kpisWithIds = tempKPIs.map(kpi => ({
          ...kpi,
          id: kpi.id || generateId(),
          createdAt: kpi.createdAt || currentTimestamp,
          updatedAt: currentTimestamp
        }));
        
        const kpiHeaders = ['id', 'name', 'target', 'actual', 'status', 'description', 'notes', 'kraId', 'kraName', 'startDate', 'endDate', 'createdAt', 'updatedAt'];
        
        // Ensure we have a KPIs entity in the data
        if (!updatedConfig.data.kpis) {
          updatedConfig.data.kpis = {
            headers: kpiHeaders,
            rows: []
          };
        }
        
        // Update KPIs data
        updatedConfig.data.kpis.rows = kpisWithIds.map(kpi => {
          const row: Record<string, string> = {};
          kpiHeaders.forEach(header => {
            row[header] = kpi[header] || '';
          });
          return row;
        });
        
        console.log('Prepared KPIs data:', updatedConfig.data.kpis);
      }
      
      // Update the CSV config with the new data
      setProgress(30);
      updateCsvConfigWithData(updatedConfig);
      
      // Create CSV files if they don't exist
      setProgress(40);
      if (Object.keys(updatedConfig.fileIds || {}).length === 0) {
        console.log('No CSV file IDs found, creating CSV files');
        
        // Clear any previous session storage to force file creation
        const sessionKey = `csv_init_attempt_${updatedConfig.folderId}`;
        sessionStorage.removeItem(sessionKey);
        
        try {
          const fileIds: Record<string, string> = {};
          
          // Ensure updatedConfig has proper typing
          const typedConfig = updatedConfig as {
            folderId: string;
            fileNames: Record<string, string>;
            data: Record<string, { headers: string[] }>;
          };
          
          // Update sessionKey to use typed config for consistency
          const typedSessionKey = `csv_init_attempt_${typedConfig.folderId}`;
          sessionStorage.removeItem(typedSessionKey);
          
          // Create CSV files in parallel
          const createFilePromises = Object.entries(typedConfig.fileNames || {}).map(async ([entityType, fileName]) => {
            console.log(`Creating CSV file for ${entityType}: ${fileName}`);
            
            // Prepare initial content with headers
            const headers = typedConfig.data[entityType]?.headers || [];
            const initialContent = headers.join(',');
            
            try {
              // Create the CSV file with properly typed folderId
              let csvFile;
              try {
                csvFile = await safeCreateCsvFile(
                  fileName,
                  initialContent,
                  typedConfig.folderId
                );
                
                if (!csvFile) throw new Error('Failed to create CSV file: No response received');
              } catch (fileError) {
                console.error(`Error creating CSV file for ${entityType}:`, fileError);
                // Create a mock file as fallback
                setIsUsingLocalStorage(true);
                const tempFileId = `local-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                localStorage.setItem(`unitopia_csv_${entityType}`, initialContent);
                csvFile = {
                  id: tempFileId,
                  name: fileName,
                  url: '',
                  content: initialContent
                };
              }
              
              if (csvFile) {
                console.log(`CSV file created for ${entityType} with ID:`, csvFile.id);
                fileIds[entityType] = csvFile.id;
              } else {
                throw new Error(`Failed to create CSV file for ${entityType}`);
              }
            } catch (fileError) {
              console.error(`Error creating CSV file for ${entityType}:`, fileError);
              throw fileError;
            }
          });
          
          // Wait for all files to be created
          await Promise.all(createFilePromises);
          
          // Update the config with the file IDs
          updatedConfig.fileIds = fileIds;
          updateCsvConfigWithData(updatedConfig);
          
          // Wait for the config update to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Error creating CSV files:', error);
          toast({
            title: "CSV File Creation Error",
            description: `Failed to create CSV files: ${error.message || 'Unknown error'}`,
            variant: "destructive",
          });
          throw error;
        }
      }
      
      // Save data to CSV files
      setProgress(60);
      console.log('Saving data to CSV files');
      await saveDataToCsv();
      
      // Load data from CSV to verify
      setProgress(80);
      await loadDataFromCsv();
      
      // Store objectives, KRAs, and KPIs in parent state
      setProgress(90);
      if (setObjectives && tempObjectives) {
        setObjectives(tempObjectives);
      }
      if (setKRAs && tempKRAs) {
        setKRAs(tempKRAs);
      }
      if (setKPIs && tempKPIs) {
        setKPIs(tempKPIs);
      }
      
      // Complete the setup
      setProgress(95);
      if (handleSetupCompleteFromHook) {
        handleSetupCompleteFromHook();
      }
      
      setProgress(100);
      toast({ 
        title: "Setup Complete", 
        description: "Your unit has been successfully configured and all data has been saved to CSV files." 
      });
      
      onComplete(); // Call parent's onComplete
      onClose();    // Call parent's onClose
    } catch (error) {
      console.error('Error completing setup:', error);
      setSetupError(`Setup error: ${error.message || 'Unknown error'}`);
      toast({ 
        title: "Setup Error", 
        description: "There was an error completing the setup process. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    csvConfig, 
    handleSetupCompleteFromHook, 
    onComplete, 
    onClose, 
    saveDataToCsv, 
    loadDataFromCsv, 
    toast, 
    tempObjectives,
    tempKRAs,
    tempKPIs, 
    updateCsvConfigWithData, 
    updateCsvConfig, 
    safeCreateCsvFile, 
    setObjectives,
    setKRAs,
    setKPIs,
    isUsingLocalStorage
  ]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Define handleSetupTypeSelect before it's used
  const handleSetupTypeSelect = useCallback((type: string) => {
    console.log('Setup type selected:', type);
    setSelectedSetupType(type);
    setSetupError(null);

    if (!setSetupMethod) {
      toast({
        title: "Setup Error",
        description: "Setup state (setSetupMethod) is not properly initialized. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Set the appropriate setup method based on the selected type
    if (type === 'onedrive') {
      try {
        console.log('[DEBUG] Setting up OneDrive integration');
        setSetupMethod('standard'); // Standard setup for OneDrive
        
        // Add a small delay to ensure console logs are visible
        setTimeout(() => {
          console.log('[DEBUG] Moving to step 1 for OneDrive setup');
          setCurrentStep(1);
        }, 500);
      } catch (error) {
        console.error('[DEBUG] Error in OneDrive setup initialization:', error);
        // Don't proceed to next step if there's an error
        setSetupError(`OneDrive initialization error: ${error.message || 'Unknown error'}`);
        
        // Revert to local storage if OneDrive fails
        setIsUsingLocalStorage(true);
      }
    } else if (type === 'csv') {
      setSetupMethod('import'); // Import method for CSV
      setCurrentStep(1);
    } else if (type === 'demo') {
      setSetupMethod('demo'); // Demo data
      setCurrentStep(1);
    }
  }, [setSetupMethod, toast, setCurrentStep]);

  // Define the render functions before they're used
  const renderInitialSelection = () => {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Choose Setup Method</h3>
          <p className="text-sm text-muted-foreground">
            Select how you want to set up your unit data
          </p>
        </div>

        <div className="grid gap-4">
          <Card
            className="p-4 cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleSetupTypeSelect('onedrive')}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Cloud className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">OneDrive Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Connect to OneDrive and select a folder to store your unit data
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleSetupTypeSelect('csv')}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Upload CSV Files</h4>
                <p className="text-sm text-muted-foreground">
                  Upload existing CSV files with your unit data
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleSetupTypeSelect('demo')}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Database className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Demo Data</h4>
                <p className="text-sm text-muted-foreground">
                  Start with sample data to explore the application
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // Add handling for the new KRA step
  const handleObjectivesComplete = useCallback((objectives: any[]) => {
    setTempObjectives(objectives);
    setCurrentStep(3); // Move to KRA setup step
  }, []);

  const handleKRAComplete = useCallback((kras: any[]) => {
    setTempKRAs(kras);
    setCurrentStep(4); // Move to KPI setup step
  }, []);

  const handleKPIComplete = useCallback((kpis: any[]) => {
    setTempKPIs(kpis);
    setCurrentStep(5); // Skip directly to the Summary step (was 5 for Review)
  }, []);

  const handleSummaryComplete = useCallback(() => {
    if (setObjectives) {
      setObjectives(tempObjectives);
    }
    if (setKRAs) {
      setKRAs(tempKRAs);
    }
    if (setKPIs) {
      setKPIs(tempKPIs);
    }
    handleComplete();
  }, [tempObjectives, tempKRAs, tempKPIs, setObjectives, setKRAs, setKPIs, handleComplete]);

  // Update handlePathSelect in step 1 to handle temp folders
  const handlePathSelect = async (config: any) => {
    console.log('OneDrive path selected:', config);
    
    if (config.isTemporary) {
      console.log('Using temporary local storage instead of OneDrive');
      setIsUsingLocalStorage(true);
      
      // Set up local storage config for later steps
      if (setOneDriveConfig) {
        setOneDriveConfig({ 
          folderId: config.folderId, 
          folderName: config.path || config.folderName,
          isTemporary: true 
        });
        toast({ 
          title: "Using Local Storage", 
          description: "Your data will be stored locally for this session.",
          duration: 3000
        });
      }
      setCurrentStep(2); // Move to Objectives step
    } else {
      // Normal OneDrive folder setup
      if (setOneDriveConfig) {
        // Ensure we're using the correct property names from the config
        setOneDriveConfig({ 
          folderId: config.folderId, 
          folderName: config.path || config.folderName 
        });
        toast({ 
          title: "OneDrive folder selected successfully!", 
          description: `Using folder: "${config.path || config.folderName}"`,
          duration: 2000
        });
      }
      
      // Add a short delay to ensure state is updated before proceeding
      setTimeout(() => {
        setCurrentStep(2); // Move to Objectives step
      }, 100);
    }
  };

  // Add a notification component to display when falling back to local storage
  const LocalStorageFallbackNotification = () => {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm leading-5 font-medium">Using Local Storage</p>
            <p className="text-xs leading-4 mt-1">
              Your setup data will be stored locally in your browser. Some features requiring OneDrive synchronization may be limited.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Error boundary component to catch rendering errors
  const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    const [hasError, setHasError] = useState(false);
    
    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        console.error("Error caught by error handler:", event);
        if (event.error && event.error.toString().includes("is not a function")) {
          setHasError(true);
          event.preventDefault(); // Prevent the error from bubbling up
        }
      };
      
      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);
    
    if (hasError) {
      return (
        <div className="border rounded-lg p-4 bg-red-50 text-red-800">
          <h4 className="font-semibold mb-2">Error displaying content</h4>
          <p>There was a problem rendering the content. Please try refreshing the page.</p>
          <div className="mt-4 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
    
    return <>{children}</>;
  };

  // Create a simplified OneDrive setup component
  const SimplifiedOneDriveSetup = ({ onComplete }: { onComplete: (config: any) => void }): JSX.Element => {
    const { isAuthenticated, loginWithMicrosoft } = useAuth();
    const { instance } = useMsal();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [newFolderName, setNewFolderName] = useState("");
    const [folders, setFolders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
    const [deletingFolder, setDeletingFolder] = useState<any | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [folderError, setFolderError] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([]);
    // Add ref to track if initial folders were loaded
    const initialFoldersLoaded = useRef(false);
    // Add ref to track the last clicked folder ID
    const lastFolderRequest = useRef<string | null>(null);
    
    // Import OneDrive functions from useMicrosoftGraph hook for folder creation/deletion
    const { 
      createFolder, 
      deleteFolder,
      isLoading: graphLoading 
    } = useMicrosoftGraph();
    
    // Auth scopes for Microsoft Graph
    const graphScopes = {
      scopes: ["Files.ReadWrite", "Sites.ReadWrite.All", "User.Read"]
    };
    
    // Fetch OneDrive documents when authenticated
    useEffect(() => {
      // Define a safe function to fetch folders that handles errors properly
      const safeFetchFolders = async () => {
        if (!isAuthenticated) {
          console.log("Not authenticated yet, skipping folder fetch");
          return;
        }
        
        // If we're already loading, don't start another fetch
        if (isLoading) {
          console.log("Already loading folders, skipping duplicate fetch");
          return;
        }
        
        // Skip if we've already loaded the initial folders
        if (initialFoldersLoaded.current) {
          console.log("Initial folders already loaded, skipping automatic fetch");
          return;
        }
        
        // Check if we have a window-level flag for too many fetch attempts
        if (window.oneDriveFetchAttempts && window.oneDriveFetchAttempts > 5) {
          console.log("Too many OneDrive fetch attempts detected in useEffect, not retrying");
          // Show a message once per session by checking a flag
          if (!window.oneDriveToastShown) {
            window.oneDriveToastShown = true;
            toast({
              title: "OneDrive Connection Failed",
              description: "We're having trouble connecting to OneDrive. You may want to use local storage instead.",
              variant: "destructive",
              duration: 10000
            });
          }
          return;
        }
        
        try {
          console.log("Attempting to fetch OneDrive folders (authenticated)");
          await fetchOneDriveFolders();
          // Mark that we've loaded initial folders
          initialFoldersLoaded.current = true;
        } catch (error) {
          console.error("Error in useEffect folder fetch:", error);
          // Errors are already handled in fetchOneDriveFolders
        }
      };
      
      // Only fetch folders if authenticated and not loading
      if (isAuthenticated && !isLoading && !initialFoldersLoaded.current) {
        // Add a small delay to ensure authentication is complete
        const timer = setTimeout(() => {
          safeFetchFolders();
        }, 1000); 
        
        return () => clearTimeout(timer);
      }
    }, [isAuthenticated]); // Remove isLoading to avoid re-fetching on loading state changes
    
    // Add useEffect to handle auth error recovery
    useEffect(() => {
      // If we have an auth error, log it for debugging
      if (authError) {
        console.error("Authentication error detected:", authError);
      }
    }, [authError]);
    
    // Handle Microsoft authentication
    const handleAuthenticate = async () => {
      try {
        setIsAuthenticating(true);
        setAuthError(null);
        setFolderError(null);
        
        console.log("Starting Microsoft authentication process");
        await loginWithMicrosoft();
        
        // Check if authentication was successful by polling for user status
        let authCheckAttempts = 0;
        const maxAuthCheckAttempts = 10;
        
        const checkAuthStatus = () => {
          return new Promise<boolean>((resolve) => {
            const checkInterval = setInterval(() => {
              authCheckAttempts++;
              console.log(`Checking auth status (attempt ${authCheckAttempts}/${maxAuthCheckAttempts})...`);
              
              if (isAuthenticated) {
                console.log("Authentication successful!");
                clearInterval(checkInterval);
                resolve(true);
              } else if (authCheckAttempts >= maxAuthCheckAttempts) {
                console.log("Authentication check timed out");
                clearInterval(checkInterval);
                resolve(false);
              }
            }, 1000);
          });
        };
        
        toast({ 
          title: "Microsoft Authentication",
          description: "Login initiated. You'll be redirected to Microsoft to sign in.",
          duration: 5000
        });
        
        // Wait for auth to complete
        const authSuccessful = await checkAuthStatus();
        
        if (!authSuccessful) {
          console.warn("Authentication process may not have completed properly");
          // Don't throw an error here - we'll try to continue anyway as the auth might be in progress
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setAuthError(error?.message || "Failed to start authentication");
        toast({
          title: "Authentication Failed",
          description: "Unable to connect to Microsoft. Try again or use local storage.",
          variant: "destructive",
          duration: 5000
        });
      } finally {
        // Give time for redirects
        setTimeout(() => {
          setIsAuthenticating(false);
          // Try fetching folders again if authenticated
          if (isAuthenticated) {
            console.log("Authentication complete, fetching folders");
            // We don't call fetchOneDriveFolders directly here as it might create a loop
          }
        }, 2000);
      }
    };
    
    // Fetch OneDrive folders directly using Microsoft Graph API
    const fetchOneDriveFolders = async (folderId?: string) => {
      console.log("fetchOneDriveFolders called with folderId:", folderId);
      
      // If this is an automatic call (no folderId) and we have a lastFolderRequest, 
      // use that to prevent unwanted resets to root
      if (!folderId && lastFolderRequest.current && initialFoldersLoaded.current) {
        console.log("Automatic call redirected to last requested folder:", lastFolderRequest.current);
        folderId = lastFolderRequest.current;
      }
      
      // Add a static counter to prevent infinite retries across component re-renders
      if (!window.oneDriveFetchAttempts) {
        window.oneDriveFetchAttempts = 0;
      }
      
      // Check if this is a new folder request or a refresh
      const isNewFolderRequest = folderId !== currentFolderId;
      
      // If just refreshing the current folder view, don't increment the counter
      if (isNewFolderRequest) {
        window.oneDriveFetchAttempts++;
        console.log(`OneDrive fetch attempt #${window.oneDriveFetchAttempts}`);
      } else {
        console.log("Refreshing current folder view, not counting as a new attempt");
      }
      
      // If we've already tried too many times, just show the local storage option
      if (window.oneDriveFetchAttempts > 5) {
        console.log("Too many OneDrive fetch attempts, suggesting local storage instead");
        setFolderError("Multiple OneDrive connection attempts failed. Please use local storage or try again later.");
        setFolders([]);
        return;
      }
      
      try {
        setIsLoading(true);
        setFolderError(null);
        
        // Check authentication status first
        if (!isAuthenticated || !instance) {
          console.log("User not authenticated, attempting authentication first");
          await handleAuthenticate();
          // After authentication completes, we'll continue with the fetch below
          if (!isAuthenticated) {
            throw new Error("Authentication required to access OneDrive");
          }
        }
        
        // Get current active account
        const accounts = instance.getAllAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error("No Microsoft account found. Please sign in again.");
        }
        
        try {
          // Get access token for Microsoft Graph
          const tokenResponse = await instance.acquireTokenSilent({
            ...graphScopes,
            account: accounts[0]
          });
          
          let endpoint;
          if (folderId) {
            // Get contents of a specific folder
            console.log(`Fetching contents of folder: ${folderId}`);
            endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$filter=folder ne null`;
            
            // If this is a new folder navigation (not a refresh of current), update the path
            if (folderId !== currentFolderId) {
              // Find the folder in the list to get its name
              const folder = folders.find(f => f.id === folderId);
              if (folder) {
                console.log("Updating folder path with:", folder.name);
                // Add this folder to the path
                setFolderPath(prev => [...prev, { id: folderId, name: folder.name }]);
              } else {
                console.log("Folder not found in current list, might be navigating directly");
              }
              
              // Remember this as our current folder ID
              lastFolderRequest.current = folderId;
            }
            
            // Update current folder ID
            setCurrentFolderId(folderId);
          } else {
            // Get root folders
            console.log("Fetching root folders from OneDrive");
            endpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null';
            
            // Reset path when navigating to root
            setFolderPath([]);
            setCurrentFolderId(null);
            lastFolderRequest.current = null;
          }
          
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${tokenResponse.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Graph API error response:", errorData);
            throw new Error(`Failed to fetch folders: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("Folder response data:", data);
          
          if (data && data.value && Array.isArray(data.value)) {
            const folderItems = data.value;
            console.log(`Retrieved ${folderItems.length} items`);
            
            // Map to a consistent format
            const formattedFolders = folderItems.map(item => ({
              id: item.id,
              name: item.name,
              isFolder: !!item.folder,
              path: item.parentReference?.path,
              webUrl: item.webUrl
            }));
            
            // Filter to only include folders
            const onlyFolders = formattedFolders.filter(item => item.isFolder);
            console.log(`Found ${onlyFolders.length} folders`);
            
            setFolders(onlyFolders);
            setFolderError(null);
            
            // We successfully loaded folders, mark the initialFoldersLoaded flag
            initialFoldersLoaded.current = true;
            
            // Reset retry counter on success
            if (isNewFolderRequest) {
              window.oneDriveFetchAttempts = 0;
            }
          } else {
            console.error("Invalid response format from Graph API:", data);
            throw new Error("Invalid response format from OneDrive API");
          }
        } catch (tokenError) {
          console.error("Token acquisition or API error:", tokenError);
          
          // If silent token acquisition fails, fall back to interactive method
          if (tokenError.name === "InteractionRequiredAuthError") {
            try {
              console.log("Silent token acquisition failed, trying interactive method");
              const tokenResponse = await instance.acquireTokenPopup(graphScopes);
              
              // Retry the fetch with the new token
              let endpoint;
              if (folderId) {
                endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$filter=folder ne null`;
              } else {
                endpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null';
              }
              
              const response = await fetch(endpoint, {
                headers: {
                  'Authorization': `Bearer ${tokenResponse.accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                throw new Error(`Failed to fetch folders: ${response.status} ${response.statusText}`);
              }
              
              const data = await response.json();
              
              if (data && data.value && Array.isArray(data.value)) {
                const folderItems = data.value;
                
                // Map to a consistent format
                const formattedFolders = folderItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  isFolder: !!item.folder,
                  path: item.parentReference?.path,
                  webUrl: item.webUrl
                }));
                
                // Filter to only include folders
                const onlyFolders = formattedFolders.filter(item => item.isFolder);
                
                setFolders(onlyFolders);
                setFolderError(null);
                initialFoldersLoaded.current = true;
                
                // Reset retry counter on success
                if (isNewFolderRequest) {
                  window.oneDriveFetchAttempts = 0;
                }
              } else {
                throw new Error("Invalid response format from OneDrive API");
              }
            } catch (interactiveError) {
              console.error("Interactive token acquisition error:", interactiveError);
              throw new Error(`Failed to authenticate: ${interactiveError.message}`);
            }
          } else {
            throw tokenError;
          }
        }
      } catch (error) {
        console.error("Error fetching OneDrive folders:", error);
        setFolderError(`Error: ${error?.message || 'Unknown error'}`);
        
        // Try to get a more detailed diagnostic about the error
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        } else {
          console.error("Non-error object thrown:", error);
        }
        
        // After multiple failures, suggest local storage
        if (window.oneDriveFetchAttempts > 3) {
          toast({
            title: "OneDrive Connection Problems",
            description: "Having trouble connecting to OneDrive. Consider using local storage instead.",
            variant: "destructive",
            duration: 7000
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add retry functionality
    const handleRetryFolderFetch = async () => {
      // Clear any existing error
      setFolderError(null);
      
      // If we're already authenticated, try fetching folders again
      if (isAuthenticated) {
        toast({
          title: "Retrying",
          description: "Attempting to fetch your OneDrive folders again...",
          duration: 3000
        });
        
        // Add a small delay before retrying
        setTimeout(() => {
          fetchOneDriveFolders(currentFolderId || undefined);
        }, 500);
      } else {
        // Try authenticating again
        handleAuthenticate();
      }
    };
    
    // Navigate to a folder
    const navigateToFolder = (folder: any) => {
      console.log("Navigating to folder:", folder.name, folder.id);
      // Store the folder ID we're requesting in the ref
      lastFolderRequest.current = folder.id;
      // This should be a manual fetch, not affected by the automatic fetch conditions
      fetchOneDriveFolders(folder.id);
    };
    
    // Navigate up one level
    const navigateUp = () => {
      if (folderPath.length === 0) {
        // Already at root, nothing to do
        console.log("Already at root, can't navigate up");
        return;
      }
      
      console.log("Navigating up from current path:", folderPath);
      
      // Remove the last item from the path
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      
      // Navigate to parent folder or root
      if (newPath.length > 0) {
        const parentFolder = newPath[newPath.length - 1];
        console.log("Navigating to parent folder:", parentFolder.name, parentFolder.id);
        lastFolderRequest.current = parentFolder.id;
        fetchOneDriveFolders(parentFolder.id);
      } else {
        // Back to root
        console.log("Navigating to root folder");
        lastFolderRequest.current = null;
        fetchOneDriveFolders();
      }
    };
    
    // Navigate to a specific point in the path
    const navigateToPathItem = (index: number) => {
      if (index < 0 || index >= folderPath.length) {
        console.log("Invalid path index:", index);
        return;
      }
      
      // If clicking on the last item in path (current folder), do nothing
      if (index === folderPath.length - 1) {
        console.log("Already at this folder, ignoring click");
        return;
      }
      
      console.log(`Navigating to path item at index ${index}:`, folderPath[index]);
      
      // Create a new path up to the clicked index
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      
      // Navigate to the folder at that index
      const folderId = newPath[index].id;
      lastFolderRequest.current = folderId;
      fetchOneDriveFolders(folderId);
    };
    
    // Handle continuing with local storage
    const continueWithLocalStorage = () => {
      try {
        setIsUsingLocalStorage(true);
        
        // Create a temporary folder ID
        const tempFolderId = `local-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        toast({
          title: "Using Local Storage",
          description: "Your data will be stored locally for this session.",
          duration: 3000
        });
        
        // Complete with local storage config
        onComplete({
          path: "Local Storage",
          folderId: tempFolderId,
          isTemporary: true
        });
      } catch (error) {
        console.error("Error setting up local storage:", error);
        toast({
          title: "Error",
          description: "There was a problem setting up local storage.",
          variant: "destructive"
        });
      }
    };
    
    // Create a folder in the current location using direct Graph API
    const handleCreateFolder = async () => {
      if (!newFolderName.trim()) {
        toast({
          title: "Folder Name Required",
          description: "Please enter a name for your new folder.",
          variant: "destructive"
        });
        return;
      }
      
      try {
        setIsLoading(true);
        setFolderError(null);
        
        if (!isAuthenticated || !instance) {
          throw new Error("Authentication required to create folders");
        }
        
        // Get current active account
        const accounts = instance.getAllAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error("No Microsoft account found. Please sign in again.");
        }
        
        // Get access token for Microsoft Graph
        const tokenResponse = await instance.acquireTokenSilent({
          scopes: ["Files.ReadWrite", "Sites.ReadWrite.All"],
          account: accounts[0]
        });
        
        // Determine endpoint based on whether we're in a specific folder or root
        let endpoint;
        if (currentFolderId) {
          // Create folder in a specific parent folder
          endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${currentFolderId}/children`;
        } else {
          // Create folder in root
          endpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
        }
        
        // Set up the request body to create a folder
        const folderData = {
          name: newFolderName,
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename"
        };
        
        // Send the request to create the folder
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(folderData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Folder creation API error:", errorData);
          throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
        }
        
        // Parse the response to get the created folder
        const newFolder = await response.json();
        
        if (newFolder && newFolder.id) {
          // Format the folder to match our expected structure
          const formattedFolder = {
            id: newFolder.id,
            name: newFolder.name,
            isFolder: true,
            path: newFolder.parentReference?.path,
            webUrl: newFolder.webUrl
          };
          
          // Add the new folder to the list
          setFolders(prev => [...prev, formattedFolder]);
          setNewFolderName("");
          
          toast({
            title: "Folder Created",
            description: `Created folder: ${formattedFolder.name}`,
            duration: 3000
          });
          
          // Auto-select the new folder
          setSelectedFolder(formattedFolder);
          
          // Automatically continue with the newly created folder
          const folderConfig = {
            path: formattedFolder.name,
            folderId: formattedFolder.id,
            isNewFolder: true,
            folderName: formattedFolder.name,
            isTemporary: false
          };
          
          console.log('Created folder, calling onComplete with config:', folderConfig);
          
          // Add a tiny delay to ensure UI update before continuing
          setTimeout(() => {
            onComplete(folderConfig);
          }, 200);
          
          // Create a reference to scroll to the new folder into view
          setTimeout(() => {
            const folderElement = document.getElementById(`folder-${newFolder.id}`);
            if (folderElement) {
              folderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Add a highlight effect
              folderElement.classList.add('highlight-folder');
              setTimeout(() => {
                folderElement.classList.remove('highlight-folder');
              }, 2000);
            }
          }, 150);
        } else {
          throw new Error("Invalid response format from folder creation");
        }
      } catch (error) {
        console.error("Error creating folder:", error);
        setFolderError(`Error creating folder: ${error.message}`);
        toast({
          title: "Error",
          description: `Failed to create folder: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Delete a folder in OneDrive using direct Graph API
    const handleDeleteFolder = async (folder: any) => {
      setDeletingFolder(folder);
      setConfirmDelete(true);
    };
    
    const confirmDeleteFolder = async () => {
      if (!deletingFolder) return;
      
      try {
        setIsLoading(true);
        setFolderError(null);
        
        if (!isAuthenticated || !instance) {
          throw new Error("Authentication required to delete folders");
        }
        
        // Get current active account
        const accounts = instance.getAllAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error("No Microsoft account found. Please sign in again.");
        }
        
        // Get access token for Microsoft Graph
        const tokenResponse = await instance.acquireTokenSilent({
          scopes: ["Files.ReadWrite", "Sites.ReadWrite.All"],
          account: accounts[0]
        });
        
        // Delete the folder by ID
        const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${deletingFolder.id}`;
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`
          }
        });
        
        if (!response.ok && response.status !== 204) { // 204 No Content is success for DELETE
          const errorData = await response.json().catch(() => ({}));
          console.error("Folder deletion API error:", errorData);
          throw new Error(`Failed to delete folder: ${response.status} ${response.statusText}`);
        }
        
        // Remove the folder from the list
        setFolders(prev => prev.filter(f => f.id !== deletingFolder.id));
        
        // Reset selection if the deleted folder was selected
        if (selectedFolder && selectedFolder.id === deletingFolder.id) {
          setSelectedFolder(null);
        }
        
        toast({
          title: "Folder Deleted",
          description: `Deleted folder: ${deletingFolder.name}`,
          duration: 3000
        });
      } catch (error) {
        console.error("Error deleting folder:", error);
        setFolderError(`Error deleting folder: ${error.message}`);
        toast({
          title: "Error",
          description: `Failed to delete folder: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        setDeletingFolder(null);
        setConfirmDelete(false);
      }
    };
    
    // Select a folder and complete the setup
    const handleSelectFolder = (folder: any) => {
      console.log('Folder selected:', folder);
      setSelectedFolder(folder);
      setIsLoading(true); // Set loading state to show user that processing is happening
      
      // Show a success toast to indicate folder selection
      toast({
        title: "Folder Selected",
        description: `Selected folder: ${folder.name}`,
        duration: 2000
      });
      
      // Automatically continue with the selected folder
      const folderConfig = {
        path: folder.name,
        folderId: folder.id,
        isTemporary: false,
        folderName: folder.name
      };
      console.log('Calling onComplete with folder config:', folderConfig);
      
      // Add a tiny delay to ensure UI update before continuing
      setTimeout(() => {
        onComplete(folderConfig);
      }, 200);
    };
    
    // This function is now only used internally when selecting a folder directly
    const handleUseSelectedFolder = () => {
      console.log('handleUseSelectedFolder called, selectedFolder:', selectedFolder);
      
      if (!selectedFolder) {
        console.error('No folder selected when handleUseSelectedFolder was called');
        return;
      }
      
      const folderConfig = {
        path: selectedFolder.name,
        folderId: selectedFolder.id,
        isTemporary: false,
        folderName: selectedFolder.name
      };
      
      console.log('Using selected folder, calling onComplete with config:', folderConfig);
      onComplete(folderConfig);
    };
    
    // Render the folder path
    const renderFolderPath = () => {
      return (
        <div className="mb-2 flex items-center text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 mr-1"
            onClick={() => fetchOneDriveFolders()}
            title="Go to root folder"
          >
            <Home className="h-4 w-4" />
          </Button>
          
          <span>/</span>
          
          {folderPath.map((folder, index) => (
            <Fragment key={folder.id}>
              <Button
                variant="link"
                size="sm"
                className="px-1 py-0 h-auto text-blue-600"
                onClick={() => navigateToPathItem(index)}
              >
                {folder.name}
              </Button>
              {index < folderPath.length - 1 && <span>/</span>}
            </Fragment>
          ))}
        </div>
      );
    };

    // Render the folder list with error boundary
    const renderFolderList = () => {
      // Ensure folders is an array before proceeding
      if (!folders || !Array.isArray(folders)) {
        console.error("Folders is not an array:", folders);
        return (
          <div className="text-center p-6 border rounded-lg bg-red-50">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
            <p className="text-red-600 font-medium">Invalid folder data</p>
            <p className="text-sm text-red-500 mt-1">There was a problem loading folder data</p>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetryFolderFetch}
                className="mx-auto flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        );
      }
      
      if (folders.length === 0) {
        return (
          <div className="text-center p-6 border rounded-lg bg-gray-50">
            <Folder className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No folders found in {folderPath.length > 0 ? 'this folder' : 'your OneDrive'}</p>
            <p className="text-sm text-gray-400 mt-1">Create a new folder to continue</p>
            
            {folderError && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRetryFolderFetch}
                  className="mx-auto flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        );
      }
      
      // Ensure we can safely iterate over folders
      try {
        return (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <div className="flex items-center">
                {folderPath.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mr-2 p-1"
                    onClick={navigateUp}
                    title="Go up one level"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <h5 className="font-medium text-sm">
                  {folderPath.length > 0 
                    ? `${folderPath[folderPath.length - 1].name}`
                    : 'OneDrive Root'}
                </h5>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => fetchOneDriveFolders(currentFolderId || undefined)}
                disabled={isLoading}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {folderPath.length > 0 && renderFolderPath()}
            
            <div className="max-h-[220px] overflow-y-auto">
              {folders.map((folder) => folder && (
                <div
                  key={folder.id || `folder-${Math.random()}`}
                  id={`folder-${folder.id}`}
                  className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedFolder?.id === folder.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => handleSelectFolder(folder)}
                  onDoubleClick={() => {
                    // Double click to either navigate into the folder or select and continue
                    if (folderPath.length < 3) {
                      navigateToFolder(folder);
                    } else {
                      // If we're already deep in the folder structure, just select and use this folder
                      handleSelectFolder(folder);
                      handleUseSelectedFolder();
                    }
                  }}
                >
                  <div className="flex items-center">
                    <Folder className="h-5 w-5 mr-2 text-blue-500" />
                    <span>{folder.name || 'Unnamed Folder'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Select the folder and immediately use it
                        handleSelectFolder(folder);
                        handleUseSelectedFolder();
                      }}
                      title="Select and continue with this folder"
                      className="text-xs px-2 py-1 h-7"
                    >
                      Select
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToFolder(folder);
                      }}
                      title="Open folder"
                    >
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder);
                      }}
                      title="Delete folder"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      } catch (error) {
        console.error("Error rendering folder list:", error);
        return (
          <div className="text-center p-6 border rounded-lg bg-red-50">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
            <p className="text-red-600 font-medium">Error rendering folders</p>
            <p className="text-sm text-red-500 mt-1">{error?.message || 'Unknown rendering error'}</p>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetryFolderFetch}
                className="mx-auto flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        );
      }
    };
    
    // Render delete confirmation dialog
    const renderDeleteConfirmation = () => {
      if (!confirmDelete || !deletingFolder) return null;
      
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Folder</h3>
            <p className="mb-4">
              Are you sure you want to delete the folder "{deletingFolder.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeletingFolder(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteFolder}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      );
    };
    
    // Return the component JSX
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold">OneDrive Integration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect to OneDrive or use local storage for your unit data
          </p>
        </div>
        
        {!isAuthenticated ? (
          /* Authentication Card */
          <Card className="p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Cloud className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Connect to Microsoft</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Use your Microsoft account to store data in OneDrive
                </p>
                
                <Button
                  onClick={handleAuthenticate}
                  disabled={isAuthenticating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Cloud className="mr-2 h-4 w-4" />
                      Connect with Microsoft
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm mt-4">
                <p>Error: {authError}</p>
              </div>
            )}
          </Card>
        ) : (
          /* OneDrive Folders Section */
          <>
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm mb-4">
              <p>✅ Successfully authenticated with Microsoft!</p>
              <p className="mt-1">Select an existing folder or create a new one for your unit data.</p>
            </div>
            
            {folderError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm mb-4 flex items-center justify-between">
                <p>{folderError}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRetryFolderFetch}
                  className="ml-2 whitespace-nowrap"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
            
            {/* Folder List */}
            {folderError ? (
              <Card className="p-6 mb-4">
                <div className="text-center space-y-4">
                  <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
                  <h4 className="font-semibold">Unable to retrieve your OneDrive folders</h4>
                  <p className="text-sm text-muted-foreground">
                    We're having trouble connecting to your OneDrive. You can try these options:
                  </p>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={handleRetryFolderFetch}
                      className="flex items-center justify-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Connection
                    </Button>
                    
                    <div className="border-t pt-4">
                      <h5 className="font-medium mb-2">Create a new folder anyway</h5>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter folder name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <Button
                          onClick={handleCreateFolder}
                          disabled={!newFolderName.trim() || isLoading}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FolderPlus className="h-4 w-4 mr-2" />}
                          Create
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Alternatively, you can use local storage instead
                      </p>
                      <Button
                        onClick={continueWithLocalStorage}
                        variant="secondary"
                        className="flex items-center justify-center"
                      >
                        Continue with Local Storage
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <ErrorBoundary>
                {renderFolderList()}
              </ErrorBoundary>
            )}
            
            {/* Create New Folder - only show when no error or we have folders */}
            {!folderError && (
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Create New Folder</h4>
                <div className="space-y-4">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateFolder();
                    }}
                    className="flex gap-2"
                  >
                    <div className="flex-1">
                      <Input
                        placeholder="Enter folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        disabled={isLoading}
                        className="w-full"
                        autoFocus
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {currentFolderId
                          ? `Creating in: ${folderPath.length > 0 ? folderPath[folderPath.length - 1].name : 'Root'}`
                          : 'Creating folder will automatically select it and continue'}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={!newFolderName.trim() || isLoading}
                      className="shrink-0"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FolderPlus className="h-4 w-4 mr-2" />}
                      Create & Continue
                    </Button>
                  </form>
                </div>
              </Card>
            )}
            
            {/* This message is no longer needed since selection is now automatic */}
            {false && !selectedFolder && folders.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50 mt-4">
                <p className="text-sm text-center text-muted-foreground">
                  Click "Select" on any folder or create a new folder to continue
                </p>
              </div>
            )}
          </>
        )}
        
        {/* Local Storage Option */}
        <div className="pt-4 border-t mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Or continue without connecting to OneDrive
          </p>
          <Button
            variant="outline"
            onClick={continueWithLocalStorage}
            className="w-full"
          >
            Continue with Local Storage
          </Button>
        </div>
        
        {/* Delete Confirmation Dialog */}
        {renderDeleteConfirmation()}
      </div>
    );
  };

  // Helper function to get appropriate icon for file types
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 mr-2 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 mr-2 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-4 w-4 mr-2 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-4 w-4 mr-2 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return <Image className="h-4 w-4 mr-2 text-purple-500" />;
      case 'csv':
        return <FileText className="h-4 w-4 mr-2 text-green-600" />;
      default:
        return <FileIcon className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Update renderStep to include an easy bypass for OneDrive
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderInitialSelection();
      case 1:
        if (selectedSetupType === 'onedrive') {
          return <SimplifiedOneDriveSetup onComplete={handlePathSelect} />;
        } else if (selectedSetupType === 'csv') {
          return (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Upload CSV Files</h3>
                <p className="text-sm text-muted-foreground">
                  Upload CSV files containing your unit data
                </p>
              </div>
              <Card className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <FileText className="h-12 w-12 text-green-500" />
                  <Button>
                    Select CSV Files
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Supported format: .csv
                  </p>
                </div>
              </Card>
              <Button
                onClick={handleNext}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          );
        } else if (selectedSetupType === 'demo') {
          return (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Demo Data</h3>
                <p className="text-sm text-muted-foreground">
                  Load sample data to explore the application
                </p>
              </div>
              <Card className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Database className="h-12 w-12 text-purple-500" />
                  <p className="text-center">
                    This will load sample data for all tabs including tasks, projects, risks, and KRAs.
                  </p>
                </div>
              </Card>
              <Button
                onClick={handleNext}
                className="w-full"
              >
                Load Demo Data
              </Button>
            </div>
          );
        }
        break;
      case 2:
        return (
          <ObjectivesSetup
            onComplete={handleObjectivesComplete}
          />
        );
      case 3:
        return (
          <KRASetup
            objectives={tempObjectives}
            onComplete={handleKRAComplete}
          />
        );
      case 4:
        return (
          <KPISetup
            onComplete={handleKPIComplete}
          />
        );
      case 5:
        return (
          <SetupSummary
            oneDriveConfig={oneDriveConfig}
            objectives={tempObjectives}
            kras={tempKRAs}
            kpis={tempKPIs}
            onComplete={handleSummaryComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  // Render Progress Steps
  const renderProgressSteps = () => {
    return (
      <div className="flex mb-8 relative">
        <div className="absolute h-0.5 bg-gray-200 top-4 left-0 right-0 z-0"></div>
        {steps.map((step) => (
          <div key={step.id} className="flex-1 text-center relative z-10">
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors",
                currentStep === step.id ? "bg-primary text-white" : 
                currentStep > step.id ? "bg-green-500 text-white" : 
                "bg-gray-200 text-gray-400"
              )}
            >
              {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id + 1}
            </div>
            <div className={cn(
              "text-xs font-medium",
              currentStep === step.id ? "text-primary" : 
              currentStep > step.id ? "text-green-500" : 
              "text-gray-400"
            )}>
              {step.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Rest of the component (Dialog structure) with updated UI
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose(); // Only call onClose when dialog is being closed
    }}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Unit Setup Wizard</DialogTitle>
          <DialogDescription>
            Configure your unit's backend storage and structure
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Circular Progress Steps */}
          {renderProgressSteps()}

          {/* Error display */}
          {setupError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{setupError}</span>
            </div>
          )}

          {/* Local storage notification */}
          {isUsingLocalStorage && currentStep > 1 && <LocalStorageFallbackNotification />}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {progress < 100 ? 'Processing...' : 'Complete!'} ({Math.round(progress)}%)
              </p>
            </div>
          )}

          {/* Step content */}
          <div className="rounded-lg border min-h-[400px] p-6">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center">Setting up your unit data...</p>
                <p className="text-sm text-muted-foreground text-center">
                  This may take a moment as we configure your data.
                </p>
              </div>
            ) : (
              <>
                {renderStep()}
              </>
            )}
          </div>

          {/* Navigation buttons */}
          {!isProcessing && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={currentStep === 0 ? "invisible" : ""}
              >
                Back
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                
                {currentStep === 5 ? (
                  <Button 
                    onClick={handleSummaryComplete}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isProcessing}
                  >
                    Complete Setup
                  </Button>
                ) : currentStep > 0 && currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    disabled={isProcessing}
                  >
                    Next
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 