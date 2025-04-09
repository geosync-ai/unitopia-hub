import { useState, useCallback, useEffect, useMemo } from 'react';
import { ExcelSyncConfig } from './useExcelSync';

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
  excelConfig: ExcelSyncConfig | null;
  setExcelConfig: (config: ExcelSyncConfig | null) => void;
  isSetupComplete: boolean;
  resetSetup: () => void;
  updateExcelConfig: () => void;
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
  const [excelConfig, setExcelConfig] = useState<ExcelSyncConfig | null>(null);
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
          setExcelConfig(parsed.excelConfig || null);
          setIsSetupComplete(parsed.isSetupComplete || false);
          
          // If setup is complete, ensure we don't show the wizard
          if (parsed.isSetupComplete) {
            setShowSetupWizard(false);
          }
        } catch (error) {
          console.error('Error loading saved setup state:', error);
        }
      }
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
        excelConfig,
        isSetupComplete
      };
      localStorage.setItem('setupWizardState', JSON.stringify(stateToSave));
    }
  }, [isInitialized, oneDriveConfig, setupMethod, objectives, excelConfig, isSetupComplete]);

  // Reset setup state
  const resetSetup = useCallback(() => {
    setOneDriveConfig(null);
    setSetupMethod('');
    setObjectives([]);
    setExcelConfig(null);
    setIsSetupComplete(false);
    localStorage.removeItem('setupWizardState');
  }, []);

  // Create Excel configuration based on setup method and objectives
  const createExcelConfig = useCallback(() => {
    if (!oneDriveConfig) return null;

    // Define sheet configurations based on setup method
    const sheets: { [key: string]: { name: string; headers: string[]; data: any[] } } = {};

    // Tasks sheet
    sheets.tasks = {
      name: 'Tasks',
      headers: ['id', 'title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'projectId', 'projectName', 'completionPercentage'],
      data: taskState?.tasks || []
    };

    // Projects sheet
    sheets.projects = {
      name: 'Projects',
      headers: ['id', 'name', 'description', 'status', 'startDate', 'endDate', 'manager', 'budget', 'budgetSpent', 'progress'],
      data: projectState?.projects || []
    };

    // Risks sheet
    sheets.risks = {
      name: 'Risks',
      headers: ['id', 'title', 'description', 'impact', 'likelihood', 'status', 'category', 'projectId', 'projectName', 'owner', 'createdAt', 'updatedAt'],
      data: riskState?.risks || []
    };

    // Assets sheet
    sheets.assets = {
      name: 'Assets',
      headers: ['id', 'name', 'type', 'serialNumber', 'assignedTo', 'department', 'purchaseDate', 'warrantyExpiry', 'status', 'notes'],
      data: assetState?.assets || []
    };

    // KRAs sheet
    sheets.kras = {
      name: 'KRAs',
      headers: ['id', 'name', 'objectiveId', 'objectiveName', 'department', 'responsible', 'startDate', 'endDate', 'progress', 'status', 'createdAt', 'updatedAt'],
      data: kraState?.kras || []
    };

    // KPIs sheet
    sheets.kpis = {
      name: 'KPIs',
      headers: ['id', 'name', 'date', 'startDate', 'target', 'actual', 'status', 'description', 'notes', 'kraId'],
      data: []
    };

    // Objectives sheet
    sheets.objectives = {
      name: 'Objectives',
      headers: ['id', 'title'],
      data: objectives.map(obj => ({ id: obj.id, title: obj.title }))
    };

    return {
      folderId: oneDriveConfig.folderId,
      fileName: 'UnitopiaHub_Data.xlsx',
      sheets
    };
  }, [oneDriveConfig, objectives, taskState?.tasks, projectState?.projects, riskState?.risks, assetState?.assets, kraState?.kras]);

  // Update Excel config when setup method or objectives change
  const updateExcelConfig = useCallback(() => {
    const newConfig = createExcelConfig();
    setExcelConfig(newConfig);
  }, [createExcelConfig]);

  // Handle setup completion
  const handleSetupComplete = useCallback(() => {
    setIsSetupComplete(true);
    setShowSetupWizard(false);
    
    // Save the completion state immediately
    const currentState = {
      oneDriveConfig,
      setupMethod,
      objectives,
      excelConfig,
      isSetupComplete: true
    };
    localStorage.setItem('setupWizardState', JSON.stringify(currentState));
  }, [oneDriveConfig, setupMethod, objectives, excelConfig]);

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
    excelConfig,
    setExcelConfig,
    isSetupComplete,
    resetSetup,
    updateExcelConfig,
    handleSetupComplete
  }), [
    showSetupWizard,
    oneDriveConfig,
    setupMethod,
    objectives,
    excelConfig,
    isSetupComplete,
    resetSetup,
    updateExcelConfig,
    handleSetupComplete
  ]);
}; 