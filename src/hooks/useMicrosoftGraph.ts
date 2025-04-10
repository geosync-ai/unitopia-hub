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
  source: 'OneDrive';
}

export interface CsvFile {
  id: string;
  name: string;
  url: string;
  content?: string;
}

/**
 * IMPORTANT: This is a placeholder implementation.
 * The real implementation is in useMicrosoftGraph.tsx
 * This file exists to address import errors in other components.
 * 
 * All functions here will be overridden by the actual implementation.
 */
export const useMicrosoftGraph = () => {
  return {
    isLoading: false,
    lastError: null,
    getAuthStatus: () => ({
      isInitialized: false,
      hasAccounts: false,
      accountCount: 0,
      activeAccount: null,
      error: null
    }),
    getAccessToken: async () => '',
    getClient: async () => null,
    getOneDriveDocuments: async () => null,
    getFolderContents: async (folderId?: string, source?: string) => null,
    createFolder: async (folderName?: string, parentFolderId?: string) => null,
    renameFolder: async (folderId?: string, newName?: string) => null,
    deleteFolder: async (folderId?: string) => false,
    createCsvFile: async (fileName?: string, initialContent?: string, parentFolderId?: string) => null,
    readCsvFile: async (fileId?: string) => '',
    updateCsvFile: async (fileId?: string, content?: string) => false,
    handleLogin: async () => null
  };
};

export default useMicrosoftGraph; 