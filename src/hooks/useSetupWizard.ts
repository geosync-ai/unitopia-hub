import { useState, useCallback, useEffect, useMemo } from 'react';
import { CsvSyncConfig } from './useCsvSync';

export interface SetupWizardState {
  showSetupWizard: boolean;
  setShowSetupWizard: (show: boolean) => void;
  oneDriveConfig: {
    folderId: string;
    folderName: string;
  } | null;
  setOneDriveConfig: (config: { folderId: string; folderName: string } | null) => void;
  setupMethod: string;
  setSetupMethod: (method: string) => void;
  objectives: any[];
  setObjectives: (objectives: any[]) => void;
  kpis: any[];
  setKPIs: (kpis: any[]) => void;
  csvConfig: CsvSyncConfig | null;
  setCsvConfig: (config: CsvSyncConfig | null) => void;
  isSetupComplete: boolean;
  resetSetup: () => void;
  updateCsvConfig: () => void;
  handleSetupComplete: () => void;
}

interface UseSetupWizardProps {
  projectState: any;
  taskState: any;
  riskState: any;
  kraState: any;
  assetState: any;
}

export const useSetupWizard = ({
  projectState,
  taskState,
  riskState,
  kraState,
  assetState,
}: UseSetupWizardProps): SetupWizardState => {
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [oneDriveConfig, setOneDriveConfig] = useState<{ folderId: string; folderName: string } | null>(null);
  const [setupMethod, setSetupMethod] = useState<string>('');
  const [objectives, setObjectives] = useState<any[]>([]);
  const [kpis, setKPIs] = useState<any[]>([]);
  const [csvConfig, setCsvConfig] = useState<CsvSyncConfig | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize setup state
  useEffect(() => {
    if (!isInitialized) {
      // Load saved state from localStorage if available
      const savedState = localStorage.getItem('setupWizardState');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setOneDriveConfig(parsed.oneDriveConfig || null);
          setSetupMethod(parsed.setupMethod || '');
          setObjectives(parsed.objectives || []);
          setKPIs(parsed.kpis || []);
          setCsvConfig(parsed.csvConfig || null);
          setIsSetupComplete(parsed.isSetupComplete || false);
          
          // If setup is complete, ensure we don't show the wizard
          if (parsed.isSetupComplete) {
            setShowSetupWizard(false);
          }
        } catch (error) {
          console.error('Error loading saved setup state:', error);
        }
      }
      
      // Add a flag to prevent multiple initializations
      localStorage.setItem('setupWizardInitialized', 'true');
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      const stateToSave = {
        oneDriveConfig,
        setupMethod,
        objectives,
        kpis,
        csvConfig,
        isSetupComplete
      };
      localStorage.setItem('setupWizardState', JSON.stringify(stateToSave));
    }
  }, [isInitialized, oneDriveConfig, setupMethod, objectives, kpis, csvConfig, isSetupComplete]);

  // Reset setup state
  const resetSetup = useCallback(() => {
    setOneDriveConfig(null);
    setSetupMethod('');
    setObjectives([]);
    setKPIs([]);
    setCsvConfig(null);
    setIsSetupComplete(false);
    localStorage.removeItem('setupWizardState');
  }, []);

  // Create CSV configuration based on setup method and data
  const createCsvConfig = useCallback(() => {
    if (!oneDriveConfig) return null;

    // Define file names for each entity type
    const fileNames = {
      objectives: 'objectives.csv',
      kras: 'kras.csv',
      kpis: 'kpis.csv',
      tasks: 'tasks.csv',
      projects: 'projects.csv',
      risks: 'risks.csv',
      assets: 'assets.csv'
    };

    // Define headers for each entity type
    const headers = {
      objectives: ['id', 'name', 'description', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
      kras: ['id', 'name', 'objectiveId', 'objectiveName', 'department', 'responsible', 'startDate', 'endDate', 'progress', 'status', 'createdAt', 'updatedAt'],
      kpis: ['id', 'name', 'kraId', 'kraName', 'target', 'actual', 'status', 'description', 'notes', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
      tasks: ['id', 'title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'projectId', 'projectName', 'createdAt', 'updatedAt'],
      projects: ['id', 'name', 'description', 'status', 'startDate', 'endDate', 'manager', 'budget', 'budgetSpent', 'progress', 'createdAt', 'updatedAt'],
      risks: ['id', 'title', 'description', 'impact', 'likelihood', 'status', 'category', 'projectId', 'projectName', 'owner', 'createdAt', 'updatedAt'],
      assets: ['id', 'name', 'type', 'serialNumber', 'assignedTo', 'department', 'purchaseDate', 'warrantyExpiry', 'status', 'notes', 'createdAt', 'updatedAt']
    };

    // Get current timestamp
    const currentTimestamp = new Date().toISOString();

    // Prepare the data structure
    const data: {
      [key: string]: {
        headers: string[];
        rows: any[];
      };
    } = {};

    // Initialize data structure with headers and empty rows
    Object.keys(headers).forEach(key => {
      data[key] = {
        headers: headers[key as keyof typeof headers],
        rows: []
      };
    });

    // Add objectives
    if (objectives && objectives.length > 0) {
      data.objectives.rows = objectives.map(obj => ({
        id: obj.id || `obj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: obj.name || '',
        description: obj.description || '',
        startDate: obj.startDate || '',
        endDate: obj.endDate || '',
        createdAt: obj.createdAt || currentTimestamp,
        updatedAt: currentTimestamp
      }));
    }

    // Add KPIs
    if (kpis && kpis.length > 0) {
      data.kpis.rows = kpis.map(kpi => ({
        ...kpi,
        createdAt: kpi.createdAt || currentTimestamp,
        updatedAt: currentTimestamp
      }));
    }

    // Add tasks if available
    if (taskState?.tasks && taskState.tasks.length > 0) {
      data.tasks.rows = taskState.tasks.map(task => ({
        ...task,
        createdAt: task.createdAt || currentTimestamp,
        updatedAt: currentTimestamp
      }));
    }

    // Add projects if available
    if (projectState?.projects && projectState.projects.length > 0) {
      data.projects.rows = projectState.projects.map(project => ({
        ...project,
        createdAt: project.createdAt || currentTimestamp,
        updatedAt: currentTimestamp
      }));
    }

    // Add risks if available
    if (riskState?.risks && riskState.risks.length > 0) {
      data.risks.rows = riskState.risks.map(risk => ({
        ...risk,
        createdAt: risk.createdAt || currentTimestamp,
        updatedAt: currentTimestamp
      }));
    }

    // Add assets if available
    if (assetState?.assets && assetState.assets.length > 0) {
      data.assets.rows = assetState.assets.map(asset => ({
        ...asset,
        createdAt: asset.createdAt || currentTimestamp,
        updatedAt: currentTimestamp
      }));
    }

    return {
      folderId: oneDriveConfig.folderId,
      fileNames,
      fileIds: {},
      data
    };
  }, [oneDriveConfig, objectives, kpis, taskState?.tasks, projectState?.projects, riskState?.risks, assetState?.assets]);

  // Update CSV config when setup method or data changes
  const updateCsvConfig = useCallback(() => {
    const newConfig = createCsvConfig();
    setCsvConfig(newConfig);
  }, [createCsvConfig]);

  // Handle setup completion
  const handleSetupComplete = useCallback(() => {
    setIsSetupComplete(true);
    setShowSetupWizard(false);
    
    // Save the completion state immediately
    const currentState = {
      oneDriveConfig,
      setupMethod,
      objectives,
      kpis,
      csvConfig,
      isSetupComplete: true
    };
    localStorage.setItem('setupWizardState', JSON.stringify(currentState));
  }, [oneDriveConfig, setupMethod, objectives, kpis, csvConfig]);

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(() => ({
    showSetupWizard,
    setShowSetupWizard,
    oneDriveConfig,
    setOneDriveConfig,
    setupMethod,
    setSetupMethod,
    objectives,
    setObjectives,
    kpis,
    setKPIs,
    csvConfig,
    setCsvConfig,
    isSetupComplete,
    resetSetup,
    updateCsvConfig,
    handleSetupComplete
  }), [
    showSetupWizard,
    oneDriveConfig,
    setupMethod,
    objectives,
    kpis,
    csvConfig,
    isSetupComplete,
    resetSetup,
    updateCsvConfig,
    handleSetupComplete
  ]);
}; 