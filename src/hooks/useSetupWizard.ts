import { useState, useCallback } from 'react';
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

  // Reset setup state
  const resetSetup = useCallback(() => {
    setOneDriveConfig(null);
    setSetupMethod('');
    setObjectives([]);
    setExcelConfig(null);
    setIsSetupComplete(false);
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
      data: []
    };

    // Projects sheet
    sheets.projects = {
      name: 'Projects',
      headers: ['id', 'name', 'description', 'status', 'startDate', 'endDate', 'manager', 'budget', 'budgetSpent', 'progress'],
      data: []
    };

    // Risks sheet
    sheets.risks = {
      name: 'Risks',
      headers: ['id', 'title', 'description', 'impact', 'likelihood', 'status', 'category', 'projectId', 'projectName', 'owner', 'createdAt', 'updatedAt'],
      data: []
    };

    // Assets sheet
    sheets.assets = {
      name: 'Assets',
      headers: ['id', 'name', 'type', 'serialNumber', 'assignedTo', 'department', 'purchaseDate', 'warrantyExpiry', 'status', 'notes'],
      data: []
    };

    // KRAs sheet
    sheets.kras = {
      name: 'KRAs',
      headers: ['id', 'name', 'objectiveId', 'objectiveName', 'department', 'responsible', 'startDate', 'endDate', 'progress', 'status', 'createdAt', 'updatedAt'],
      data: []
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

    // If using demo data, populate with mock data
    if (setupMethod === 'demo') {
      sheets.tasks.data = taskState.tasks || [];
      sheets.projects.data = projectState.projects || [];
      sheets.risks.data = riskState.risks || [];
      sheets.assets.data = assetState.assets || [];
      sheets.kras.data = kraState.kras || [];
    }

    return {
      folderId: oneDriveConfig.folderId,
      fileName: 'UnitopiaHub_Data.xlsx',
      sheets
    };
  }, [oneDriveConfig, setupMethod, objectives, taskState, projectState, riskState, assetState, kraState]);

  // Update Excel config when setup method or objectives change
  const updateExcelConfig = useCallback(() => {
    const newConfig = createExcelConfig();
    setExcelConfig(newConfig);
  }, [createExcelConfig]);

  // Handle setup completion
  const handleSetupComplete = useCallback(() => {
    setIsSetupComplete(true);
    setShowSetupWizard(false);
  }, []);

  return {
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
  };
}; 