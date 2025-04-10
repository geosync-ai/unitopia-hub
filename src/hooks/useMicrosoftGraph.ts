export interface Document {
  id: string;
  name: string;
  url: string;
  lastModified: string;
  size: number;
  isFolder?: boolean;
  parentReference?: {
    path: string;
  };
  source: 'SharePoint' | 'OneDrive';
}

export const useMicrosoftGraph = () => {
  // This is a placeholder implementation
  // The real implementation is in useMicrosoftGraph.tsx
  // This file exists to address import errors in other components
  
  return {
    isLoading: false,
    lastError: null,
    getAuthStatus: () => ({}),
    getAccessToken: async () => '',
    getOneDriveDocuments: async () => null,
    getFolderContents: async () => null,
    createFolder: async () => null,
    renameFolder: async () => null,
    deleteFolder: async () => false,
    createCsvFile: async () => null,
    readCsvFile: async () => '',
    updateCsvFile: async () => false
  };
}; 