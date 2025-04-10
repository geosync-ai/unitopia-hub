import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
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
  source: 'OneDrive';
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
  const [isRequestLocked, setIsRequestLocked] = useState(false);
  const [hasFetchAttempted, setHasFetchAttempted] = useState(false);
  const fetchTimeoutRef = useRef<any>(null);

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

  /**
   * Gets current Microsoft authentication status
   * @returns Object with authentication status information
   */
  const getAuthStatus = useCallback(() => {
    try {
      // Guard against missing MSAL instance
      if (!window.msalInstance) {
        return {
          isInitialized: false,
          hasAccounts: false,
          accountCount: 0,
          activeAccount: null,
          error: "MSAL instance not available"
        };
      }
      
      // Safely get accounts
      let accounts = [];
      try {
        accounts = window.msalInstance.getAllAccounts();
      } catch (error) {
        console.error("Error getting accounts:", error);
        return {
          isInitialized: true,
          hasAccounts: false,
          accountCount: 0,
          activeAccount: null,
          error: `Error getting accounts: ${error.message}`
        };
      }
      
      // Create a safe account object
      const activeAccount = accounts && accounts.length > 0 ? {
        // Type the account object properties explicitly
        username: accounts[0].username || '',
        name: accounts[0].name || '',
        localAccountId: accounts[0].localAccountId || ''
      } : null;
      
      return {
        isInitialized: true,
        hasAccounts: accounts && accounts.length > 0,
        accountCount: accounts ? accounts.length : 0,
        activeAccount: activeAccount,
        error: null
      };
    } catch (error) {
      console.error("Error in getAuthStatus:", error);
      return {
        isInitialized: false,
        hasAccounts: false,
        accountCount: 0,
        activeAccount: null,
        error: `Error checking auth status: ${error.message}`
      };
    }
  }, []);

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

  const getOneDriveDocuments = useCallback(async (): Promise<Document[] | null> => {
    console.log('Attempting to get OneDrive documents...');

    // Guard against multiple concurrent requests
    if (isRequestLocked) {
      console.log('Request already in progress, skipping duplicate request');
      return null;
    }
    
    setIsRequestLocked(true);
    setIsLoading(true);
    
    // Clear any existing fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    // Basic validation
    const msalInstance = window.msalInstance;
    if (!msalInstance) {
      console.error('MSAL not initialized');
      setLastError('Microsoft authentication not initialized');
      setIsRequestLocked(false);
      setIsLoading(false);
      toast.error('Authentication service not initialized. Please refresh the page and try again.');
      return null;
    }
    
    try {
      // Get accounts safely
      let accounts = [];
      try {
        accounts = msalInstance.getAllAccounts();
      } catch (accountError) {
        console.error('Error getting accounts:', accountError);
        setLastError(`Error getting accounts: ${accountError.message}`);
        setIsRequestLocked(false);
        setIsLoading(false);
        return null;
      }
      
      if (!accounts || accounts.length === 0) {
        console.log('No accounts found, cannot fetch OneDrive documents');
        setLastError('No Microsoft account found. Please sign in first.');
        setIsRequestLocked(false);
        setIsLoading(false);
        return null;
      }
      
      // Set active account if not already set
      if (!msalInstance.getActiveAccount() && accounts.length > 0) {
        console.log('Setting active account to:', accounts[0].username);
        msalInstance.setActiveAccount(accounts[0]);
      }

      // Set the request lock to prevent duplicate requests
      setHasFetchAttempted(true);
      setLastError(null);

      try {
        console.log('Acquiring token for OneDrive documents...');
        
        // Try to acquire token with retry mechanism
        let response;
        try {
          response = await msalInstance.acquireTokenSilent({
            scopes: ['User.Read', 'Files.Read.All', 'Files.ReadWrite.All'],
            account: accounts[0]
          });
        } catch (tokenError) {
          console.warn('Silent token acquisition failed, trying interactive fallback:', tokenError);
          
          // Try interactive acquisition as fallback
          try {
            response = await msalInstance.acquireTokenPopup({
              scopes: ['User.Read', 'Files.Read.All', 'Files.ReadWrite.All']
            });
          } catch (interactiveError) {
            throw new Error(`Failed to acquire authentication token: ${interactiveError.message}`);
          }
        }
        
        if (!response || !response.accessToken) {
          throw new Error('Failed to obtain access token');
        }
        
        console.log('Token acquired successfully for OneDrive');

        // Use Microsoft Graph endpoint to get root items
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
        console.log(`Retrieved ${data.value?.length || 0} OneDrive items`);
        
        // Filter to only include folders and files we're interested in
        const filteredItems = data.value.filter(item => 
          // Include all folders and specific file types
          item.folder || 
          (item.name && item.name.endsWith('.csv'))
        );
        
        console.log(`Filtered to ${filteredItems.length} relevant items`);
        
        setIsLoading(false);
        setIsRequestLocked(false);
        
        return filteredItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          url: item.webUrl || item['@microsoft.graph.downloadUrl'] || '',
          lastModified: item.lastModifiedDateTime || new Date().toISOString(),
          size: item.size || 0,
          isFolder: item.folder !== undefined,
          parentReference: item.parentReference,
          source: 'OneDrive' as const
        }));
      } catch (error) {
        console.error('Error fetching OneDrive documents:', error);
        const errorMsg = error.message || 'Unknown fetch error';
        setLastError(`OneDrive documents error: ${errorMsg}`);
        
        // Set a timeout before allowing another request
        fetchTimeoutRef.current = setTimeout(() => {
          console.log('Fetch request lock released after timeout');
          setIsRequestLocked(false);
        }, 5000); // 5 second cooldown before allowing next request
        
        throw error;
      }
    } catch (error) {
      console.error('Error in getOneDriveDocuments:', error);
      setLastError(`OneDrive error: ${error.message || 'Unknown error'}`);
      setIsRequestLocked(false);
      setIsLoading(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [msalInstance, toast, isRequestLocked]);

  const getFolderContents = useCallback(async (folderId: string, source: string): Promise<Document[] | null> => {
    console.log(`Getting contents of folder: ${folderId} from ${source}`);
    setIsLoading(true);
    
    try {
      if (source !== 'OneDrive') {
        throw new Error('Unsupported source. Only OneDrive is supported.');
      }
      
      if (!checkMsalAuth()) {
        console.error('Authentication check failed');
        setIsLoading(false);
        return null;
      }
      
      const accounts = msalInstance.getAllAccounts();
      
      // Get token
      let response;
      try {
        response = await msalInstance.acquireTokenSilent({
          scopes: ['User.Read', 'Files.Read.All', 'Files.ReadWrite.All'],
          account: accounts[0]
        });
      } catch (tokenError) {
        console.warn('Silent token acquisition failed, trying interactive fallback:', tokenError);
        
        try {
          response = await msalInstance.acquireTokenPopup({
            scopes: ['User.Read', 'Files.Read.All', 'Files.ReadWrite.All']
          });
        } catch (interactiveError) {
          throw new Error(`Failed to acquire authentication token: ${interactiveError.message}`);
        }
      }
      
      // Get folder contents using Microsoft Graph API
      const graphEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;
      console.log('Fetching folder contents from endpoint:', graphEndpoint);
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
      console.log(`Retrieved ${data.value?.length || 0} items from folder ${folderId}`);
      
      // Filter to only include folders and files we're interested in
      const filteredItems = data.value.filter(item => 
        // Include all folders and specific file types
        item.folder || 
        (item.name && item.name.endsWith('.csv'))
      );
      
      console.log(`Filtered to ${filteredItems.length} relevant items`);
      
      return filteredItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl || item['@microsoft.graph.downloadUrl'] || '',
        lastModified: item.lastModifiedDateTime || new Date().toISOString(),
        size: item.size || 0,
        isFolder: item.folder !== undefined,
        parentReference: item.parentReference,
        source: 'OneDrive' as const
      }));
    } catch (error) {
      console.error('Error getting folder contents:', error);
      setLastError(`Error getting folder contents: ${error.message}`);
      toast.error(`Could not access folder: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [msalInstance, checkMsalAuth, toast]);

  // Create a new folder in OneDrive
  const createFolder = useCallback(async (folderName: string, parentFolderId?: string): Promise<Document | null> => {
    console.log(`Creating folder "${folderName}" ${parentFolderId ? `under parent ${parentFolderId}` : 'in root'}`);
    setIsLoading(true);
    
    try {
      if (!checkMsalAuth()) {
        console.error('Authentication check failed');
        setIsLoading(false);
        return null;
      }
      
      const accounts = msalInstance.getAllAccounts();
      
      // Get token
      let response;
      try {
        response = await msalInstance.acquireTokenSilent({
          scopes: ['User.Read', 'Files.ReadWrite.All'],
          account: accounts[0]
        });
      } catch (tokenError) {
        console.warn('Silent token acquisition failed, trying interactive fallback:', tokenError);
        
        try {
          response = await msalInstance.acquireTokenPopup({
            scopes: ['User.Read', 'Files.ReadWrite.All']
          });
        } catch (interactiveError) {
          throw new Error(`Failed to acquire authentication token: ${interactiveError.message}`);
        }
      }
      
      // Create folder
      let graphEndpoint;
      if (parentFolderId) {
        // Create in specific folder
        graphEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children`;
      } else {
        // Create in root
        graphEndpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
      }
      
      console.log('Creating folder using endpoint:', graphEndpoint);
      
      const result = await fetch(graphEndpoint, {
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
        console.error('OneDrive GraphAPI error response:', result.status, errorText);
        throw new Error(`Failed to create folder (${result.status}): ${result.statusText}`);
      }
      
      const data = await result.json();
      console.log('Folder created successfully:', data);
      
      toast.success(`Created folder: ${folderName}`);
      
      return {
        id: data.id,
        name: data.name,
        url: data.webUrl || '',
        lastModified: data.lastModifiedDateTime || new Date().toISOString(),
        size: 0,
        isFolder: true,
        parentReference: data.parentReference,
        source: 'OneDrive' as const
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      setLastError(`Error creating folder: ${error.message}`);
      toast.error(`Failed to create folder: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [msalInstance, checkMsalAuth, toast]);

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

  // Delete a folder in OneDrive
  const deleteFolder = useCallback(async (folderId: string): Promise<boolean> => {
    if (!checkMsalAuth()) {
      const status = getAuthStatus();
      const errorMsg = status.error || 'Authentication check failed.';
      setLastError(`Delete folder error: ${errorMsg}`);
      toast.error(`Failed to delete folder: ${errorMsg}`);
      return false;
    }
    
    setIsLoading(true);
    setLastError(null);
    
    try {
      console.log(`Acquiring token to delete folder ID '${folderId}'...`);
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });
      console.log('Token acquired for delete folder');

      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}`;
      console.log(`Deleting folder at endpoint:`, endpoint);

      const result = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('Delete folder GraphAPI error:', result.status, errorText);
        throw new Error(`Failed Graph API request (${result.status}): ${result.statusText}`);
      }

      console.log(`Folder deleted successfully (ID: ${folderId})`);
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      const errorMsg = error.message || 'Unknown delete error';
      setLastError(`Delete folder error: ${errorMsg}`);
      toast.error('Failed to delete folder');
      return false;
    } finally {
      setIsLoading(false);
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
    getOneDriveDocuments,
    getFolderContents,
    createFolder,
    renameFolder,
    deleteFolder,
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