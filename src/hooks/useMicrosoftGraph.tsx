import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useMsal } from '@azure/msal-react';
import { Client } from '@microsoft/microsoft-graph-client';

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

export interface CsvFile {
  id: string;
  name: string;
  url: string;
  content?: string;
}

export const useMicrosoftGraph = () => {
  const { user } = useAuth();
  const { instance: msalInstance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Helper function to check if MSAL is properly initialized and has an active account
  const checkMsalAuth = useCallback(() => {
    if (!msalInstance) {
      console.error('MSAL instance not found');
      setLastError('MSAL instance not found - authentication service not initialized');
      return false;
    }
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      console.error('No accounts found');
      return false;
    }
    
    if (!msalInstance.getActiveAccount() && accounts.length > 0) {
      console.log('Setting active account to:', accounts[0].username);
      msalInstance.setActiveAccount(accounts[0]);
    }
    
    return true;
  }, [msalInstance]);

  // Debug function to get authentication status
  const getAuthStatus = useCallback(() => {
    try {
      if (!msalInstance) {
        return {
          isInitialized: false,
          hasAccounts: false,
          activeAccount: null,
          error: 'MSAL instance not found'
        };
      }
      
      const accounts = msalInstance.getAllAccounts();
      const activeAccount = msalInstance.getActiveAccount();
      
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
  }, [msalInstance]);

  const getAccessToken = useCallback(async () => {
    try {
      const account = msalInstance.getAllAccounts()[0];
      if (!account) {
        throw new Error('No account found');
      }
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['https://graph.microsoft.com/.default'],
        account
      });
      return response.accessToken;
    } catch (err) {
      console.error('Error getting access token:', err);
      throw err;
    }
  }, [msalInstance]);

  const getClient = useCallback(async () => {
    const accessToken = await getAccessToken();
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }, [getAccessToken]);

  const getSharePointDocuments = async (): Promise<Document[] | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      console.log('Acquiring token for SharePoint documents...');
      const response = await msalInstance.acquireTokenSilent({
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
    
    // Enhanced authentication check
    if (!msalInstance) {
      console.error('MSAL instance not found or not initialized');
      setLastError('MSAL instance not found - authentication service not initialized');
      toast.error('Authentication service not initialized. Please refresh the page and try again.');
      return null;
    }
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      console.error('No Microsoft accounts found');
      setLastError('No Microsoft accounts found. Please sign in first.');
      toast.error('You need to sign in with Microsoft before accessing OneDrive');
      return null;
    }
    
    // Set active account if not already set
    if (!msalInstance.getActiveAccount() && accounts.length > 0) {
      console.log('Setting active account to:', accounts[0].username);
      msalInstance.setActiveAccount(accounts[0]);
    }

    setIsLoading(true);
    setLastError(null);

    try {
      console.log('Acquiring token for OneDrive documents...');
      
      // Try to acquire token with retry mechanism
      let response;
      try {
        response = await msalInstance.acquireTokenSilent({
          scopes: ['User.Read', 'Files.Read.All'],
          account: accounts[0]
        });
      } catch (tokenError) {
        console.warn('Silent token acquisition failed, trying interactive fallback:', tokenError);
        
        // Try interactive acquisition as fallback
        try {
          response = await msalInstance.acquireTokenPopup({
            scopes: ['User.Read', 'Files.Read.All']
          });
        } catch (interactiveError) {
          throw new Error(`Failed to acquire authentication token: ${interactiveError.message}`);
        }
      }
      
      if (!response || !response.accessToken) {
        throw new Error('Failed to obtain access token');
      }
      
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
      toast.error(`Failed to fetch OneDrive documents: ${errorMsg}`);
      setIsLoading(false);
      return null;
    }
  }, [msalInstance, toast]);

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
      const response = await msalInstance.acquireTokenSilent({ scopes });
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
  }, [checkMsalAuth, getAuthStatus, msalInstance]);

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
      const response = await msalInstance.acquireTokenSilent({
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
  }, [checkMsalAuth, getAuthStatus, msalInstance]);

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
      const response = await msalInstance.acquireTokenSilent({
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
  }, [checkMsalAuth, getAuthStatus, msalInstance]);

  // Create a new CSV file in OneDrive
  const createCsvFile = async (fileName: string, initialContent: string = '', parentFolderId?: string | unknown): Promise<CsvFile | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      // Make sure parentFolderId is a string if present
      const folderId = parentFolderId ? String(parentFolderId) : undefined;
      
      console.log('Creating CSV file:', fileName, 'in folder:', folderId);
      
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const baseEndpoint = 'https://graph.microsoft.com/v1.0/me/drive';
      const endpoint = folderId 
        ? `${baseEndpoint}/items/${folderId}/children`
        : `${baseEndpoint}/root/children`;

      console.log('Using endpoint:', endpoint);

      // Create an empty CSV file with proper content type
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
            mimeType: 'text/csv'
          }
        })
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('Failed to create CSV file:', result.status, result.statusText, errorText);
        throw new Error(`Failed to create CSV file: ${result.statusText} - ${errorText}`);
      }

      const data = await result.json();
      console.log('CSV file created with ID:', data.id);
      
      // If initial content is provided, update the file with it
      if (initialContent) {
        await updateCsvFile(data.id, initialContent);
      }

      return {
        id: data.id,
        name: data.name,
        url: data.webUrl || '',
        content: initialContent
      };
    } catch (error) {
      console.error('Error creating CSV file:', error);
      toast.error('Failed to create CSV file');
      throw error;
    }
  };

  // Read content from a CSV file
  const readCsvFile = async (fileId: string): Promise<string> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      console.log('Reading CSV file with ID:', fileId);
      
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
      console.log('Using endpoint:', endpoint);
      
      const result = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('Failed to read CSV file:', result.status, result.statusText, errorText);
        throw new Error(`Failed to read CSV file: ${result.statusText}`);
      }

      const content = await result.text();
      return content;
    } catch (error) {
      console.error('Error reading CSV file:', error);
      toast.error('Failed to read CSV file');
      throw error;
    }
  };

  // Update a CSV file with new content
  const updateCsvFile = async (fileId: string, content: string): Promise<boolean> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      console.log('Updating CSV file with ID:', fileId);
      
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
      console.log('Using endpoint:', endpoint);
      
      const result = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'text/csv; charset=utf-8'
        },
        body: content
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('Failed to update CSV file:', result.status, result.statusText, errorText);
        throw new Error(`Failed to update CSV file: ${result.statusText}`);
      }

      console.log('CSV file updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating CSV file:', error);
      toast.error('Failed to update CSV file');
      throw error;
    }
  };

  // Return memoized functions
  return {
    getSharePointDocuments,
    getOneDriveDocuments,
    getFolderContents,
    createFolder,
    renameFolder,
    createCsvFile,
    readCsvFile,
    updateCsvFile,
    isLoading,
    lastError,
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