// Common type definitions for setup wizard components

// OneDrive config type
export interface OneDriveConfig {
  folderId: string;
  folderName: string;
  isTemporary?: boolean;
  path?: string;
}

// Folder item from OneDrive
export interface FolderItem {
  id: string;
  name: string;
  isFolder: boolean;
  path?: string;
  webUrl?: string;
}

// CSV Configuration
export interface CsvConfig {
  folderId?: string;
  folderName?: string;
  fileIds?: Record<string, string>;
  fileNames?: Record<string, string>;
  data?: Record<string, {
    headers: string[];
    rows: Record<string, string>[];
  }>;
}

// Setup Wizard specific props
export interface SetupWizardSpecificProps {
  setSetupMethod: (method: string) => void;
  setOneDriveConfig: (config: OneDriveConfig | null) => void;
  setObjectives: (objectives: any[]) => void;
  setKRAs: (kras: any[]) => void;
  setKPIs: (kpis: any[]) => void;
  handleSetupCompleteFromHook: () => void;
  updateCsvConfig: () => void;
  csvConfig: CsvConfig;
  oneDriveConfig: OneDriveConfig | null;
  setupMethodProp?: string;
  objectivesProp?: any[];
  krasProp?: any[];
  kpisProp?: any[];
  isSetupComplete: boolean;
}

// Setup Wizard props
export interface SetupWizardProps extends SetupWizardSpecificProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Step interface for wizard navigation
export interface WizardStep {
  id: number;
  name: string;
} 