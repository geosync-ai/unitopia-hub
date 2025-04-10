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
  FileIcon
} from 'lucide-react';
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

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
          folderName: config.path,
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
        setOneDriveConfig({ folderId: config.folderId, folderName: config.path });
        toast({ 
          title: "OneDrive folder selected successfully!", 
          description: `Using folder: "${config.path}"`,
          duration: 2000
        });
      }
      setCurrentStep(2); // Move to Objectives step
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

  // Enhanced OneDriveSetup component with file browser functionality
  const SimplifiedOneDriveSetup = ({ onComplete }) => {
    const { isAuthenticated, loginWithMicrosoft } = useAuth();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [viewMode, setViewMode] = useState<'selection' | 'browser'>('selection');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([]);
    const itemsLoadedRef = useRef(false);
    
    // Load files and folders from OneDrive with enhanced error handling and debugging
    const loadItems = async (folderId?: string) => {
      if (isLoading) return; // Prevent multiple calls
      
      try {
        setIsLoading(true);
        setAuthError(null);
        
        console.log("Starting OneDrive content load...", folderId ? `For folder: ${folderId}` : "For root folder");
        
        // Use Microsoft Graph API to get files and folders
        const { getFolderContents, getOneDriveDocuments, getAccessToken } = useMicrosoftGraph();
        
        // First check if we can get an access token - this verifies authentication
        const token = await getAccessToken();
        console.log("Microsoft access token obtained:", token ? "Success" : "Failed");
        
        if (!token) {
          throw new Error("Failed to get Microsoft access token. Please try logging in again.");
        }
        
        let documents;
        
        // Add retry logic for API calls
        const fetchWithRetry = async (fetchFn: Function, maxRetries = 3) => {
          let retries = 0;
          while (retries < maxRetries) {
            try {
              const result = await fetchFn();
              console.log("OneDrive API call successful, data:", result ? "Data received" : "No data");
              return result;
            } catch (error) {
              retries++;
              console.error(`OneDrive API call failed (attempt ${retries}/${maxRetries}):`, error);
              
              if (retries >= maxRetries) throw error;
              
              // Wait before retrying - exponential backoff
              await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
          }
          return null;
        };
        
        if (folderId) {
          // Get contents of a specific folder
          documents = await fetchWithRetry(() => getFolderContents(folderId));
          console.log(`Loaded folder contents for ID ${folderId}:`, documents ? `${documents.length} items` : "No items found");
        } else {
          // Get root items
          documents = await fetchWithRetry(() => getOneDriveDocuments());
          console.log("Loaded root OneDrive contents:", documents ? `${documents.length} items` : "No items found");
          // Reset folder path when loading root
          setFolderPath([]);
        }
        
        if (!documents || !Array.isArray(documents)) {
          console.warn("OneDrive API returned invalid data:", documents);
          documents = []; // Set to empty array for consistent handling
          
          // Show a specific error message
          setAuthError("Unable to retrieve your OneDrive files and folders. The API returned an invalid response.");
        }
        
        // Log detailed info about documents
        if (Array.isArray(documents) && documents.length > 0) {
          console.log("Sample document item:", documents[0]);
          console.log("Folders:", documents.filter(d => d && d.isFolder).length);
          console.log("Files:", documents.filter(d => d && !d.isFolder).length);
        }
        
        // Sort items: folders first, then files alphabetically
        const sortedItems = Array.isArray(documents) 
          ? [...documents].sort((a, b) => {
              // Protect against null items
              if (!a || !b) return 0;
              
              // Folders first
              if (a.isFolder && !b.isFolder) return -1;
              if (!a.isFolder && b.isFolder) return 1;
              // Alphabetical by name
              return (a.name || '').localeCompare(b.name || '');
            }).filter(item => item && (item.name || item.id)) // Filter out invalid items
          : [];
        
        console.log("Processed items:", sortedItems.length);
        setItems(sortedItems);
        setCurrentFolderId(folderId || null);
        
        // If we've ended up with no items, offer a helpful message
        if (sortedItems.length === 0) {
          if (folderId) {
            setAuthError("This folder is empty. You can create a new folder or navigate to a different location.");
          } else {
            setAuthError("No files or folders found in your OneDrive root. You can create a new folder to continue.");
          }
        }
      } catch (error) {
        console.error("Error loading OneDrive items:", error);
        
        let errorMessage = "Could not load items from OneDrive.";
        
        if (error instanceof Error) {
          errorMessage += ` Error: ${error.message}`;
          console.error("Stack trace:", error.stack);
        }
        
        // Check for common error types
        if (error.toString().includes("unauthorized") || 
            error.toString().includes("access token") || 
            error.toString().includes("auth")) {
          errorMessage = "Authentication error. Please try connecting to OneDrive again.";
        } else if (error.toString().includes("network") || 
                  error.toString().includes("timeout") ||
                  error.toString().includes("connect")) {
          errorMessage = "Network error when connecting to OneDrive. Please check your internet connection.";
        }
        
        setAuthError(`${errorMessage} You can try refreshing, or use local storage instead.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Navigate to a folder
    const navigateToFolder = (folder: any) => {
      // Add current folder to path before navigating
      if (currentFolderId) {
        const currentFolder = items.find(item => item.id === currentFolderId);
        if (currentFolder) {
          setFolderPath([...folderPath, { id: currentFolderId, name: currentFolder.name }]);
        }
      }
      
      // Load contents of selected folder
      loadItems(folder.id);
      
      // If in selection mode, set this as the selected folder
      if (viewMode === 'selection') {
        setSelectedFolder(folder);
      }
    };
    
    // Navigate up to parent folder
    const navigateUp = () => {
      if (folderPath.length === 0) {
        // Already at root, reload root
        loadItems();
        return;
      }
      
      // Get the parent folder from the path
      const newPath = [...folderPath];
      const parentFolder = newPath.pop();
      setFolderPath(newPath);
      
      if (parentFolder) {
        // If we have a parent, load it
        loadItems(parentFolder.id);
      } else {
        // If no parent (should not happen), load root
        loadItems();
      }
    };
    
    // Navigate to a specific folder in the path
    const navigateToPathFolder = (index: number) => {
      if (index < 0 || index >= folderPath.length) return;
      
      const newPath = folderPath.slice(0, index);
      setFolderPath(newPath);
      
      // If index is 0, we're navigating to the first item in path
      // which is a direct child of root, so pass its ID
      if (index === 0) {
        loadItems(folderPath[0].id);
      } else {
        // Otherwise load the folder at the specified index
        loadItems(folderPath[index].id);
      }
    };

    // Add back the useEffect for loading initial items after authentication
    // Load files and folders after authentication - only once for root
    useEffect(() => {
      if (isAuthenticated && !itemsLoadedRef.current && !isLoading) {
        console.log("Authentication detected, loading OneDrive items...");
        itemsLoadedRef.current = true;
        
        // Add a small delay to ensure auth is fully complete
        setTimeout(() => {
          loadItems();
        }, 1000);
      }
    }, [isAuthenticated, isLoading]);
    
    // Add a manual load function for debugging
    const handleForceReload = () => {
      console.log("Manual reload requested");
      itemsLoadedRef.current = false; // Reset the ref to allow reloading
      loadItems(currentFolderId); // Load current folder or root
    };
    
    // Modify the handleAuthenticate function
    const handleAuthenticate = async () => {
      if (isAuthenticating) return; // Prevent multiple clicks
      
      try {
        setIsAuthenticating(true);
        setAuthError(null);
        console.log("Starting Microsoft authentication flow...");
        
        await loginWithMicrosoft();
        console.log("Authentication initiated, redirecting to Microsoft login");
      } catch (error) {
        console.error('Error starting authentication:', error);
        setAuthError(error.message || 'Failed to start authentication');
      } finally {
        setTimeout(() => {
          setIsAuthenticating(false);
        }, 1000);
      }
    };
    
    // Handle continue with local storage
    const continueWithLocalStorage = () => {
      setIsUsingLocalStorage(true);
      toast({ 
        title: "Using Local Storage", 
        description: "Your data will be stored locally for this session.",
        duration: 3000
      });
      onComplete({
        path: "Local Storage",
        folderId: `local-${Date.now()}`,
        isTemporary: true
      });
    };
    
    // Proceed with selected folder
    const handleContinueWithFolder = () => {
      if (!selectedFolder) {
        toast({
          title: "No folder selected",
          description: "Please select a folder to continue",
          variant: "destructive"
        });
        return;
      }
      
      onComplete({
        path: selectedFolder.name,
        folderId: selectedFolder.id,
        isNewFolder: false
      });
    };
    
    // Handle folder creation with improved error handling
    const handleCreateFolder = async () => {
      if (!newFolderName.trim()) {
        toast({
          title: "Folder name required",
          description: "Please enter a name for the new folder",
          variant: "destructive"
        });
        return;
      }
      
      try {
        setIsCreatingFolder(true);
        setAuthError(null);
        console.log(`Creating folder "${newFolderName}" ${currentFolderId ? `in parent folder: ${currentFolderId}` : "in root"}`);
        
        // Get token first to verify authentication
        const { getAccessToken, createFolder } = useMicrosoftGraph();
        const token = await getAccessToken();
        
        if (!token) {
          throw new Error("Authentication token not available. Please try logging in again.");
        }
        
        // Add retry logic
        let newFolder = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!newFolder && attempts < maxAttempts) {
          attempts++;
          try {
            // Create in current folder if we have one, otherwise in root
            newFolder = await createFolder(newFolderName, currentFolderId || undefined);
            console.log(`Folder created on attempt ${attempts}:`, newFolder);
          } catch (err) {
            console.error(`Folder creation attempt ${attempts} failed:`, err);
            if (attempts >= maxAttempts) throw err;
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (newFolder) {
          // Add new folder to list
          setItems(prevItems => [...prevItems, newFolder]);
          setNewFolderName("");
          
          // Automatically select the newly created folder
          setSelectedFolder(newFolder);
          
          toast({
            title: "Folder created",
            description: `Created folder: ${newFolderName}`,
            duration: 3000,
          });
        } else {
          throw new Error("Failed to create folder after multiple attempts");
        }
      } catch (error) {
        console.error("Error creating folder:", error);
        
        let errorMessage = "Could not create folder.";
        if (error instanceof Error) {
          errorMessage += ` ${error.message}`;
        }
        
        toast({
          title: "Error creating folder",
          description: errorMessage,
          variant: "destructive"
        });
        
        setAuthError("Folder creation failed. This could be due to permission issues or network problems.");
      } finally {
        setIsCreatingFolder(false);
      }
    };
    
    // Handle folder renaming
    const handleRenameFolder = async (folder: any, newName: string) => {
      if (!newName.trim()) {
        toast({
          title: "Folder name required",
          description: "Please enter a new name for the folder",
          variant: "destructive"
        });
        return;
      }
      
      try {
        const { renameFolder } = useMicrosoftGraph();
        const updatedFolder = await renameFolder(folder.id, newName);
        
        if (updatedFolder) {
          // Update folder in list
          setItems(prevItems => 
            prevItems.map(item => item.id === folder.id ? updatedFolder : item)
          );
          
          // Update selected folder if needed
          if (selectedFolder && selectedFolder.id === folder.id) {
            setSelectedFolder(updatedFolder);
          }
          
          toast({
            title: "Folder renamed",
            description: `Renamed folder to: ${newName}`
          });
        } else {
          throw new Error("Failed to rename folder");
        }
      } catch (error) {
        console.error("Error renaming folder:", error);
        toast({
          title: "Error renaming folder",
          description: error.message || "Could not rename folder",
          variant: "destructive"
        });
      }
    };
    
    // Handle folder deletion
    const handleDeleteFolder = async (folder: any) => {
      if (!confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
        return;
      }
      
      try {
        const { deleteFolder } = useMicrosoftGraph();
        const success = await deleteFolder(folder.id);
        
        if (success) {
          // Remove folder from list
          setItems(prevItems => prevItems.filter(item => item.id !== folder.id));
          
          // Deselect if this was the selected folder
          if (selectedFolder && selectedFolder.id === folder.id) {
            setSelectedFolder(null);
          }
          
          toast({
            title: "Folder deleted",
            description: `Deleted folder: ${folder.name}`
          });
        } else {
          throw new Error("Failed to delete folder");
        }
      } catch (error) {
        console.error("Error deleting folder:", error);
        toast({
          title: "Error deleting folder",
          description: error.message || "Could not delete folder",
          variant: "destructive"
        });
      }
    };
    
    return (
      <div className="space-y-6">
        {!isAuthenticated ? (
          // Authentication step - not yet authenticated
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <div className="flex items-start">
                <Cloud className="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-800">Connect to OneDrive</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Connect to your Microsoft OneDrive to store your data in the cloud.
                  </p>
                  <Button
                    onClick={handleAuthenticate}
                    disabled={isAuthenticating}
                    className="mt-3 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect to OneDrive'
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <p>Authentication error: {authError}</p>
                <p className="mt-1">Please try again or continue with local storage.</p>
                <Button
                  variant="outline"
                  onClick={continueWithLocalStorage}
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  Use Local Storage Instead
                </Button>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                onClick={continueWithLocalStorage}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Continue with Local Storage
              </Button>
            </div>
          </div>
        ) : (
          // Folder management - authenticated
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">OneDrive Integration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect to OneDrive to browse and select a folder for your unit data
              </p>
              <div className="flex justify-center">
                <Button
                  variant="default"
                  size="sm"
                  className="mb-4"
                  onClick={handleAuthenticate}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Cloud className="mr-2 h-4 w-4" />
                      Connect to OneDrive
                    </>
                  )}
                </Button>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex justify-center mb-4">
                <div className="bg-muted p-0.5 rounded-md flex">
                  <Button
                    size="sm"
                    variant={viewMode === 'selection' ? "default" : "ghost"}
                    className="rounded-sm h-8"
                    onClick={() => setViewMode('selection')}
                  >
                    <Folder className="h-3.5 w-3.5 mr-2" />
                    Folder Selection
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'browser' ? "default" : "ghost"}
                    className="rounded-sm h-8"
                    onClick={() => setViewMode('browser')}
                  >
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    File Browser
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{viewMode === 'selection' ? 'Select Folder' : 'Browse Files'}</h3>
                
                <div className="p-2 bg-muted rounded">
                  <div className="font-semibold mb-1">API Connection</div>
                  <div>{items.length > 0 ? "✅ Working" : "⚠️ Not Confirmed"}</div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-end gap-2 mb-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleForceReload}
                  disabled={isLoading}
                  title="Force reload OneDrive contents"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Refresh
                </Button>
                
                {viewMode === 'browser' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={navigateUp}
                  >
                    <ArrowUp className="h-3.5 w-3.5 mr-1" />
                    Up
                  </Button>
                )}
              </div>
              
              {/* OneDrive Status */}
              <div className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded mb-3 text-xs">
                <div className="flex items-center">
                  <Cloud className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  <span>OneDrive Connection: </span>
                  <span className={`ml-1 font-medium ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                    {isAuthenticated ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span>Items: </span>
                  <span className="ml-1 font-medium">
                    {items.length} ({items.filter(i => i && i.isFolder).length} folders)
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs">
                <details className="text-left">
                  <summary className="cursor-pointer hover:text-foreground">Direct API Response</summary>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs py-0 w-full"
                    onClick={async () => {
                      try {
                        // Get token
                        const { getAccessToken } = useMicrosoftGraph();
                        const token = await getAccessToken();
                        
                        if (!token) {
                          throw new Error("No access token available");
                        }
                        
                        // Get root content
                        const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        
                        if (!response.ok) {
                          throw new Error(`API response: ${response.status} ${response.statusText}`);
                        }
                        
                        const data = await response.json();
                        console.log("Direct API response:", data);
                        
                        // Show count and first item
                        const itemCount = data.value?.length || 0;
                        const firstItem = data.value && data.value.length > 0 ? data.value[0].name : 'None';
                        
                        toast({
                          title: "Direct API Result",
                          description: `Found ${itemCount} items. First item: ${firstItem}`,
                        });
                      } catch (error) {
                        console.error("Direct API error:", error);
                        toast({
                          title: "Direct API Error",
                          description: error.message || "Failed to call API directly",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Test Direct API Call
                  </Button>
                </details>
              </div>
            </div>
            
            {/* Breadcrumb Navigation */}
            {folderPath.length > 0 && (
              <div className="flex flex-wrap items-center text-sm text-muted-foreground bg-muted/30 p-2 rounded mb-3 overflow-x-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 py-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    loadItems();
                  }}
                >
                  Root
                </Button>
                {folderPath.map((folder, index) => (
                  <Fragment key={folder.id}>
                    <span className="mx-1">/</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 py-1 text-xs max-w-[150px] truncate"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToPathFolder(index);
                      }}
                    >
                      {folder.name}
                    </Button>
                  </Fragment>
                ))}
              </div>
            )}
            
            {/* Folder Creation */}
            <div className="flex gap-2 items-center border p-2 rounded-md mb-4">
              <Input
                placeholder="New folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button 
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="whitespace-nowrap"
              >
                {isCreatingFolder ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <FolderPlus className="h-3 w-3 mr-1" />
                )}
                Create Folder
              </Button>
            </div>

            {/* Files and Folders List */}
            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted p-2 font-medium text-sm">
                {viewMode === 'selection' 
                  ? 'Select a folder to store your unit data' 
                  : 'Browse your OneDrive files and folders'}
              </div>
              <div className="divide-y max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="bg-muted inline-flex rounded-full p-3 mb-4">
                      {currentFolderId ? 
                        <Folder className="h-6 w-6 text-muted-foreground" /> :
                        <Cloud className="h-6 w-6 text-blue-500" />
                      }
                    </div>
                    <h3 className="text-sm font-medium mb-1">
                      {viewMode === 'selection'
                        ? 'No folders found'
                        : currentFolderId 
                          ? 'This folder is empty' 
                          : 'Your OneDrive root is empty'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {viewMode === 'selection'
                        ? 'Use the form above to create a new folder for your data'
                        : 'You can create a new folder or upload files using OneDrive'}
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => {
                        // Focus the folder name input
                        const input = document.querySelector('input[placeholder="New folder name"]') as HTMLInputElement;
                        if (input) {
                          input.focus();
                        }
                      }}
                    >
                      <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
                      Create New Folder
                    </Button>
                  </div>
                ) : (
                  items.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-2 flex items-center justify-between hover:bg-muted/50 cursor-pointer ${
                        selectedFolder && selectedFolder.id === item.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => {
                        if (item.isFolder) {
                          navigateToFolder(item);
                        } else if (viewMode === 'browser') {
                          // For files in browser mode, we could preview or download them
                          // For now, just show a toast with file details
                          toast({
                            title: "File selected",
                            description: `Name: ${item.name}, Size: ${formatFileSize(item.size || 0)}`,
                          });
                        }
                      }}
                    >
                      <div className="flex items-center">
                        {item.isFolder ? (
                          <Folder className="h-4 w-4 mr-2 text-amber-500" />
                        ) : (
                          getFileIcon(item.name)
                        )}
                        <span className="truncate max-w-[200px]">{item.name}</span>
                      </div>
                      <div className="flex gap-1">
                        {viewMode === 'selection' && item.isFolder && (
                          <Button 
                            size="sm" 
                            variant={selectedFolder?.id === item.id ? "default" : "outline"} 
                            className="text-xs py-1 h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFolder(item);
                            }}
                          >
                            {selectedFolder?.id === item.id ? 'Selected' : 'Select'}
                          </Button>
                        )}
                        
                        {item.isFolder && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                const newName = prompt("Enter new folder name:", item.name);
                                if (newName && newName.trim()) handleRenameFolder(item, newName);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(item);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={continueWithLocalStorage}
              >
                Use Local Storage Instead
              </Button>
              
              {viewMode === 'selection' ? (
                <Button
                  onClick={handleContinueWithFolder}
                  disabled={!selectedFolder}
                >
                  Continue with Selected Folder
                </Button>
              ) : (
                <Button
                  onClick={() => setViewMode('selection')}
                >
                  Switch to Selection Mode
                </Button>
              )}
            </div>
          </div>
        )}
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