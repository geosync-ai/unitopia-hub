import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

export interface ExcelFile {
  id: string;
  name: string;
  url: string;
  sheets: string[];
}

export const useMicrosoftGraph = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Helper function to check if MSAL is properly initialized and has an active account
  const checkMsalAuth = useCallback(() => {
    if (!window.msalInstance) {
      console.error('MSAL instance not found');
      setLastError('MSAL instance not found - authentication service not initialized');
      return false;
    }
    
    const accounts = window.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      console.error('No accounts found');
      return false;
    }
    
    if (!window.msalInstance.getActiveAccount() && accounts.length > 0) {
      console.log('Setting active account to:', accounts[0].username);
      window.msalInstance.setActiveAccount(accounts[0]);
    }
    
    return true;
  }, []);

  // Debug function to get authentication status
  const getAuthStatus = useCallback(() => {
    try {
      if (!window.msalInstance) {
        return {
          isInitialized: false,
          hasAccounts: false,
          activeAccount: null,
          error: 'MSAL instance not found'
        };
      }
      
      const accounts = window.msalInstance.getAllAccounts();
      const activeAccount = window.msalInstance.getActiveAccount();
      
      return {
        isInitialized: true,
        hasAccounts: accounts.length > 0,
        accountCount: accounts.length,
        activeAccount: activeAccount ? {
          username: activeAccount.username,
          name: activeAccount.name,
          localAccountId: activeAccount.localAccountId
        } : null,
        error: null
      };
    } catch (error) {
      return {
        isInitialized: false,
        hasAccounts: false,
        activeAccount: null,
        error: error.message || 'Unknown error checking auth status'
      };
    }
  }, []);

  const getSharePointDocuments = async (): Promise<Document[] | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      console.log('Acquiring token for SharePoint documents...');
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.Read.All', 'Sites.Read.All']
      });
      console.log('Token acquired successfully');

      const graphEndpoint = 'https://graph.microsoft.com/v1.0/sites/root/drive/root/children';
      console.log('Fetching from endpoint:', graphEndpoint);
      const result = await fetch(graphEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('GraphAPI error response:', errorText);
        throw new Error(`Failed to fetch SharePoint documents: ${result.statusText}`);
      }

      const data = await result.json();
      console.log(`Retrieved ${data.value.length} SharePoint items`);
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl || item['@microsoft.graph.downloadUrl'],
        lastModified: item.lastModifiedDateTime,
        size: item.size || 0,
        isFolder: item.folder !== undefined,
        parentReference: item.parentReference,
        source: 'SharePoint' as const
      }));
    } catch (error) {
      console.error('Error fetching SharePoint documents:', error);
      setLastError(`SharePoint documents error: ${error.message}`);
      toast.error('Failed to fetch SharePoint documents');
      throw error;
    }
  };

  const getOneDriveDocuments = useCallback(async (): Promise<Document[] | null> => {
    console.log('Attempting to get OneDrive documents...');
    if (!checkMsalAuth()) {
      const status = getAuthStatus();
      const errorMsg = status.error || 'Authentication check failed.';
      setLastError(`OneDrive fetch error: ${errorMsg}`);
      toast.error(`Failed to fetch OneDrive documents: ${errorMsg}`);
      return null;
    }

    setIsLoading(true);
    setLastError(null);

    try {
      console.log('Acquiring token for OneDrive documents...');
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['User.Read', 'Files.Read.All']
      });
      console.log('Token acquired successfully for OneDrive');

      const graphEndpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
      console.log('Fetching OneDrive from endpoint:', graphEndpoint);
      const result = await fetch(graphEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('OneDrive GraphAPI error response:', result.status, errorText);
        throw new Error(`Failed Graph API request (${result.status}): ${result.statusText}`);
      }

      const data = await result.json();
      console.log(`Retrieved ${data.value.length} OneDrive items`);
      setIsLoading(false);
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl || item['@microsoft.graph.downloadUrl'],
        lastModified: item.lastModifiedDateTime,
        size: item.size || 0,
        isFolder: item.folder !== undefined,
        parentReference: item.parentReference,
        source: 'OneDrive' as const
      }));
    } catch (error) {
      console.error('Error fetching OneDrive documents:', error);
      const errorMsg = error.message || 'Unknown fetch error';
      setLastError(`OneDrive documents error: ${errorMsg}`);
      toast.error('Failed to fetch OneDrive documents');
      setIsLoading(false);
      return null;
    }
  }, [checkMsalAuth, getAuthStatus]);

  const getFolderContents = useCallback(async (folderId: string, source: 'SharePoint' | 'OneDrive'): Promise<Document[] | null> => {
    if (!checkMsalAuth()) {
       const status = getAuthStatus();
       const errorMsg = status.error || 'Authentication check failed.';
       setLastError(`Folder contents error: ${errorMsg}`);
       toast.error(`Failed to fetch folder contents: ${errorMsg}`);
       return null; 
    }

    setIsLoading(true);
    setLastError(null);
    try {
      const scopes = source === 'SharePoint' 
          ? ['Files.Read.All', 'Sites.Read.All'] 
          : ['User.Read', 'Files.Read.All'];
      console.log(`Acquiring token for ${source} folder contents (ID: ${folderId})...`);
      const response = await window.msalInstance.acquireTokenSilent({ scopes });
      console.log(`Token acquired for ${source} folder contents`);

      const baseEndpoint = source === 'SharePoint' 
        ? 'https://graph.microsoft.com/v1.0/sites/root/drive/items'
        : 'https://graph.microsoft.com/v1.0/me/drive/items';
      
      const graphEndpoint = `${baseEndpoint}/${folderId}/children`;
      console.log(`Fetching ${source} folder contents from:`, graphEndpoint);
      
      const result = await fetch(graphEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error(`${source} GraphAPI error response:`, result.status, errorText);
        throw new Error(`Failed Graph API request (${result.status}): ${result.statusText}`);
      }

      const data = await result.json();
      console.log(`Retrieved ${data.value.length} items from ${source} folder ${folderId}`);
      setIsLoading(false);
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl || item['@microsoft.graph.downloadUrl'],
        lastModified: item.lastModifiedDateTime,
        size: item.size || 0,
        isFolder: item.folder !== undefined,
        parentReference: item.parentReference,
        source: source
      }));
    } catch (error) {
      console.error('Error fetching folder contents:', error);
      const errorMsg = error.message || 'Unknown fetch error';
      setLastError(`Folder contents error: ${errorMsg}`);
      toast.error('Failed to fetch folder contents');
      setIsLoading(false);
      return null;
    }
  }, [checkMsalAuth, getAuthStatus]);

  // Create a new folder in OneDrive
  const createFolder = useCallback(async (folderName: string, parentFolderId?: string): Promise<Document | null> => {
    if (!checkMsalAuth()) {
       const status = getAuthStatus();
       const errorMsg = status.error || 'Authentication check failed.';
       setLastError(`Create folder error: ${errorMsg}`);
       toast.error(`Failed to create folder: ${errorMsg}`);
       return null; 
    }
    
    setIsLoading(true);
    setLastError(null);
    try {
      console.log(`Acquiring token to create folder '${folderName}'...`);
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });
      console.log('Token acquired for create folder');

      const baseEndpoint = 'https://graph.microsoft.com/v1.0/me/drive';
      const endpoint = parentFolderId 
        ? `${baseEndpoint}/items/${parentFolderId}/children`
        : `${baseEndpoint}/root/children`;
      console.log(`Creating folder at endpoint:`, endpoint);

      const result = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('Create folder GraphAPI error:', result.status, errorText);
        throw new Error(`Failed Graph API request (${result.status}): ${result.statusText}`);
      }

      const data = await result.json();
      console.log(`Folder '${data.name}' created successfully (ID: ${data.id})`);
      setIsLoading(false);
      return {
        id: data.id,
        name: data.name,
        url: data.webUrl || '',
        lastModified: data.lastModifiedDateTime,
        size: data.size || 0,
        isFolder: true,
        parentReference: data.parentReference,
        source: 'OneDrive' as const
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      const errorMsg = error.message || 'Unknown create error';
      setLastError(`Create folder error: ${errorMsg}`);
      toast.error('Failed to create folder');
      setIsLoading(false);
      return null;
    }
  }, [checkMsalAuth, getAuthStatus]);

  // Rename a folder in OneDrive
  const renameFolder = useCallback(async (folderId: string, newName: string): Promise<Document | null> => {
    if (!checkMsalAuth()) {
       const status = getAuthStatus();
       const errorMsg = status.error || 'Authentication check failed.';
       setLastError(`Rename folder error: ${errorMsg}`);
       toast.error(`Failed to rename folder: ${errorMsg}`);
       return null;
    }
    
    setIsLoading(true);
    setLastError(null);
    try {
      console.log(`Acquiring token to rename folder ID '${folderId}' to '${newName}'...`);
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });
       console.log('Token acquired for rename folder');

      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}`;
      console.log(`Renaming folder at endpoint:`, endpoint);

      const result = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newName
        })
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('Rename folder GraphAPI error:', result.status, errorText);
        throw new Error(`Failed Graph API request (${result.status}): ${result.statusText}`);
      }

      const data = await result.json();
      console.log(`Folder renamed successfully to '${data.name}' (ID: ${data.id})`);
      setIsLoading(false);
      return {
        id: data.id,
        name: data.name,
        url: data.webUrl || '',
        lastModified: data.lastModifiedDateTime,
        size: data.size || 0,
        isFolder: true,
        parentReference: data.parentReference,
        source: 'OneDrive' as const
      };
    } catch (error) {
      console.error('Error renaming folder:', error);
      const errorMsg = error.message || 'Unknown rename error';
      setLastError(`Rename folder error: ${errorMsg}`);
      toast.error('Failed to rename folder');
      setIsLoading(false);
      return null;
    }
  }, [checkMsalAuth, getAuthStatus]);

  // Create a new Excel file in OneDrive
  const createExcelFile = async (fileName: string, parentFolderId?: string): Promise<ExcelFile | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      console.log('Creating Excel file:', fileName, 'in folder:', parentFolderId);
      
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const baseEndpoint = 'https://graph.microsoft.com/v1.0/me/drive';
      const endpoint = parentFolderId 
        ? `${baseEndpoint}/items/${parentFolderId}/children`
        : `${baseEndpoint}/root/children`;

      console.log('Using endpoint:', endpoint);

      // Create an empty Excel file with proper content type
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          '@microsoft.graph.conflictBehavior': 'replace',
          file: {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        })
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('Failed to create Excel file:', result.status, result.statusText, errorText);
        throw new Error(`Failed to create Excel file: ${result.statusText} - ${errorText}`);
      }

      const data = await result.json();
      console.log('Excel file created with ID:', data.id);
      
      // Wait a moment for the file to be fully created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the sheets in the Excel file
      const sheetsEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${data.id}/workbook/worksheets`;
      console.log('Fetching sheets from:', sheetsEndpoint);
      
      const sheetsResult = await fetch(sheetsEndpoint, {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`
        }
      });

      if (!sheetsResult.ok) {
        const errorText = await sheetsResult.text();
        console.error('Failed to get Excel sheets:', sheetsResult.status, sheetsResult.statusText, errorText);
        throw new Error(`Failed to get Excel sheets: ${sheetsResult.statusText} - ${errorText}`);
      }

      const sheetsData = await sheetsResult.json();
      const sheets = sheetsData.value.map((sheet: any) => sheet.name);
      console.log('Excel sheets:', sheets);
      
      // Create default sheets if needed
      const defaultSheets = ['Objectives', 'KRAs', 'KPIs', 'Tasks', 'Projects', 'Risks', 'Assets'];
      const missingSheets = defaultSheets.filter(sheet => !sheets.includes(sheet));
      
      if (missingSheets.length > 0) {
        console.log('Creating missing sheets:', missingSheets);
        
        for (const sheetName of missingSheets) {
          const addSheetEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${data.id}/workbook/worksheets/add`;
          console.log(`Adding sheet ${sheetName} using endpoint:`, addSheetEndpoint);
          
          const addSheetResult = await fetch(addSheetEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${response.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: sheetName
            })
          });
          
          if (!addSheetResult.ok) {
            const errorText = await addSheetResult.text();
            console.error(`Failed to add sheet ${sheetName}:`, addSheetResult.status, addSheetResult.statusText, errorText);
            // Continue with other sheets even if one fails
          } else {
            console.log(`Successfully added sheet ${sheetName}`);
          }
        }
        
        // Wait a moment for the sheets to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the updated list of sheets
        const updatedSheetsResult = await fetch(sheetsEndpoint, {
          headers: {
            'Authorization': `Bearer ${response.accessToken}`
          }
        });
        
        if (updatedSheetsResult.ok) {
          const updatedSheetsData = await updatedSheetsResult.json();
          sheets.length = 0; // Clear the array
          sheets.push(...updatedSheetsData.value.map((sheet: any) => sheet.name));
          console.log('Updated Excel sheets:', sheets);
        }
      }

      return {
        id: data.id,
        name: data.name,
        url: data.webUrl || '',
        sheets
      };
    } catch (error) {
      console.error('Error creating Excel file:', error);
      toast.error('Failed to create Excel file');
      throw error;
    }
  };

  // Read data from an Excel file
  const readExcelFile = async (fileId: string, sheetName: string, range: string): Promise<any[][] | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets/${sheetName}/range(address='${range}')`;
      
      const result = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        throw new Error(`Failed to read Excel file: ${result.statusText}`);
      }

      const data = await result.json();
      return data.values;
    } catch (error) {
      console.error('Error reading Excel file:', error);
      toast.error('Failed to read Excel file');
      throw error;
    }
  };

  // Update data in an Excel file
  const updateExcelFile = async (fileId: string, sheetName: string, range: string, values: any[][]): Promise<boolean> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      console.log(`Updating Excel file ${fileId}, sheet ${sheetName}, range ${range}`);
      console.log(`Data to update:`, values);
      
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets/${sheetName}/range(address='${range}')`;
      console.log(`Using endpoint: ${endpoint}`);
      
      const result = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values
        })
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error(`Failed to update Excel file: ${result.status} ${result.statusText}`, errorText);
        throw new Error(`Failed to update Excel file: ${result.statusText} - ${errorText}`);
      }

      console.log(`Successfully updated Excel file ${fileId}, sheet ${sheetName}`);
      return true;
    } catch (error) {
      console.error('Error updating Excel file:', error);
      toast.error('Failed to update Excel file');
      throw error;
    }
  };

  // Get all sheets in an Excel file
  const getExcelSheets = async (fileId: string): Promise<string[] | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets`;
      
      const result = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        throw new Error(`Failed to get Excel sheets: ${result.statusText}`);
      }

      const data = await result.json();
      return data.value.map((sheet: any) => sheet.name);
    } catch (error) {
      console.error('Error getting Excel sheets:', error);
      toast.error('Failed to get Excel sheets');
      throw error;
    }
  };

  // Return memoized functions
  return {
    getSharePointDocuments, // Consider memoizing if needed
    getOneDriveDocuments,
    getFolderContents,
    createFolder,
    renameFolder,
    createExcelFile, // Consider memoizing if needed
    readExcelFile, // Consider memoizing if needed
    updateExcelFile, // Consider memoizing if needed
    getExcelSheets, // Consider memoizing if needed
    isLoading,
    lastError, // Expose the error state for UI feedback
    getAuthStatus
  };
};

// Add global type definition for the MSAL instance
declare global {
  interface Window {
    msalInstance: any;
  }
}

export default useMicrosoftGraph; 