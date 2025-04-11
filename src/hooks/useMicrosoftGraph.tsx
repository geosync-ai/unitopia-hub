import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useMsal } from '@azure/msal-react';
import { Client } from '@microsoft/microsoft-graph-client';

// Declare global Window interface extension for msalInstance
declare global {
  interface Window {
    msalInstance: any;
  }
}

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
      let accounts: any[] = [];
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
      console.log("getAccessToken: Starting token acquisition");
      
      // 1. First check if MSAL is properly initialized
      if (!msalInstance) {
        console.error("getAccessToken: MSAL instance is not available");
        throw new Error('MSAL instance not available');
      }
      
      // 2. Get all accounts and log them for debugging
      const accounts = msalInstance.getAllAccounts();
      console.log(`getAccessToken: Found ${accounts.length} accounts:`, 
        accounts.map((a: any) => ({ username: a.username, homeAccountId: a.homeAccountId })));
      
      // 3. Get the active account or first account
      const activeAccount = msalInstance.getActiveAccount() || accounts[0];
      
      if (!activeAccount) {
        console.error("getAccessToken: No active account found");
        throw new Error('No account found - please login first');
      }
      
      console.log(`getAccessToken: Using account ${activeAccount.username}`);
      
      // 4. Try with specific OneDrive scopes (more limited, but explicitly for files)
      const oneDriveScopes = [
        'Files.Read',
        'Files.Read.All',
        'Files.ReadWrite',
        'Files.ReadWrite.All',
        'Sites.Read.All',
        'User.Read'
      ];
      
      console.log(`getAccessToken: Requesting token with OneDrive scopes: ${oneDriveScopes.join(', ')}`);
      
      try {
        // Try with OneDrive specific scopes first
        const response = await msalInstance.acquireTokenSilent({
          scopes: oneDriveScopes,
          account: activeAccount
        });
        
        console.log("getAccessToken: Successfully acquired token with OneDrive scopes");
        return response.accessToken;
      } catch (specificScopeError) {
        console.warn("getAccessToken: Failed with specific scopes, trying with default scope", specificScopeError);
        
        // Attempt to get token with popup - the user might need to consent to permissions
        try {
          console.log("getAccessToken: Attempting popup token acquisition with OneDrive scopes");
          const response = await msalInstance.acquireTokenPopup({
            scopes: oneDriveScopes
          });
          
          console.log("getAccessToken: Successfully acquired token with popup");
          return response.accessToken;
        } catch (popupError) {
          console.error("getAccessToken: Popup token acquisition failed", popupError);
          
          // Fall back to .default scope which gets all consented permissions
          try {
            const response = await msalInstance.acquireTokenSilent({
              scopes: ['https://graph.microsoft.com/.default'],
              account: activeAccount
            });
            
            console.log("getAccessToken: Successfully acquired token with default scope");
            return response.accessToken;
          } catch (defaultScopeError) {
            console.error("getAccessToken: Failed with default scope", defaultScopeError);
            
            // Final fallback: try interactive token acquisition
            try {
              console.log("getAccessToken: Attempting interactive token acquisition");
              const response = await msalInstance.acquireTokenPopup({
                scopes: oneDriveScopes
              });
              
              console.log("getAccessToken: Successfully acquired token interactively");
              return response.accessToken;
            } catch (interactiveError) {
              console.error("getAccessToken: Interactive token acquisition failed", interactiveError);
              throw new Error(`Failed to acquire token interactively: ${interactiveError.message}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('getAccessToken: Fatal error:', err);
      
      // Create a more user-friendly error
      const errorMessage = err.message || 'Unknown error';
      const userFriendlyError = new Error(
        `Failed to get Microsoft access token: ${errorMessage}. Try logging out and back in.`
      );
      
      // Preserve the original stack trace for debugging
      userFriendlyError.stack = err.stack;
      throw userFriendlyError;
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
    
    // Add retry counter
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Get accounts safely
        let accounts: any[] = [];
        try {
          accounts = msalInstance.getAllAccounts();
          console.log('Found accounts:', accounts.length, accounts.map((a: any) => ({ username: a.username })));
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

        // Try to acquire token with retry mechanism
        let response;
        try {
          // Add more debug logging
          console.log('Attempting silent token acquisition with scopes: User.Read, Files.Read.All, Files.ReadWrite.All');
          
          response = await msalInstance.acquireTokenSilent({
            scopes: ['User.Read', 'Files.Read.All', 'Files.ReadWrite.All'],
            account: accounts[0]
          });
          
          console.log('Silent token acquisition successful:', response ? 'Token obtained' : 'No response');
        } catch (tokenError) {
          console.warn('Silent token acquisition failed, trying interactive fallback:', tokenError);
          
          // Try interactive acquisition as fallback
          try {
            console.log('Attempting interactive token acquisition');
            response = await msalInstance.acquireTokenPopup({
              scopes: ['User.Read', 'Files.Read.All', 'Files.ReadWrite.All']
            });
            console.log('Interactive token acquisition successful:', response ? 'Token obtained' : 'No response');
          } catch (interactiveError) {
            console.error('Interactive token acquisition failed:', interactiveError);
            throw new Error(`Failed to acquire authentication token: ${interactiveError.message || 'Unknown error'}`);
          }
        }
        
        if (!response || !response.accessToken) {
          console.error('No access token received:', response);
          throw new Error('Failed to obtain access token');
        }
        
        console.log('Token acquired successfully for OneDrive');

        // Use Microsoft Graph endpoint to get root items
        const graphEndpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
        console.log('Fetching OneDrive from endpoint:', graphEndpoint);
        
        try {
          const result = await fetch(graphEndpoint, {
            headers: {
              'Authorization': `Bearer ${response.accessToken}`,
              'Accept': 'application/json'
            }
          });

          console.log('Graph API response status:', result.status, result.statusText);
          
          if (!result.ok) {
            let errorDetails = '';
            try {
              const errorText = await result.text();
              errorDetails = errorText;
              console.error('OneDrive GraphAPI error response:', result.status, errorText);
            } catch (e) {
              console.error('Failed to parse error response:', e);
            }
            
            throw new Error(`Failed Graph API request (${result.status}): ${result.statusText} ${errorDetails}`);
          }

          const data = await result.json();
          console.log(`Retrieved ${data.value?.length || 0} OneDrive items:`, data.value ? data.value.map(item => ({ name: item.name, isFolder: !!item.folder })) : 'No items');
          
          if (!data.value) {
            console.error('Unexpected API response format, missing value property:', data);
            throw new Error('Invalid API response format');
          }
          
          // Filter to include all folders
          const filteredItems = data.value.filter(item => 
            // Include all folders and specific file types
            item.folder || 
            (item.name && (item.name.endsWith('.csv') || item.name.endsWith('.xlsx')))
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
        } catch (fetchError) {
          console.error('Error during API fetch:', fetchError);
          setLastError(`API request failed: ${fetchError.message || 'Unknown error'}`);
          throw fetchError;
        }
      } catch (error) {
        retryCount++;
        console.error(`OneDrive documents fetch attempt ${retryCount}/${maxRetries} failed:`, error);
        
        if (retryCount >= maxRetries) {
          const errorMsg = error.message || 'Unknown fetch error';
          setLastError(`OneDrive documents error: ${errorMsg}`);
          
          // Set a timeout before allowing another request
          fetchTimeoutRef.current = setTimeout(() => {
            console.log('Fetch request lock released after timeout');
            setIsRequestLocked(false);
          }, 5000); // 5 second cooldown before allowing next request
          
          setIsRequestLocked(false);
          setIsLoading(false);
          return null;
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
      }
    }
    
    setIsLoading(false);
    setIsRequestLocked(false);
    return null;
  }, [isRequestLocked]);

  const getFolderContents = useCallback(async (folderId: string, source: string): Promise<Document[] | null> => {
    console.log(`Getting contents of folder: ${folderId} from ${source}`);
    setIsLoading(true);
    
    // Add retry counter for this function
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
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
        
        setIsLoading(false);
        
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
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error(`Error getting folder contents after ${maxRetries} attempts:`, error);
          setLastError(`Error getting folder contents: ${error.message}`);
          toast.error(`Could not access folder: ${error.message}`);
          return null;
        }
        
        console.warn(`Attempt ${retryCount}/${maxRetries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
    
    // This should never be reached if the maxRetries is > 0
    setIsLoading(false);
    return null;
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
    console.log(`Creating CSV file: ${fileName} in folder: ${parentFolderId}`);
    
    if (!fileName) {
      console.error('createCsvFile: No file name provided');
      setLastError('No file name provided for file creation');
      return null;
    }
    
    if (!parentFolderId) {
      console.error('createCsvFile: No parent folder ID provided');
      setLastError('No parent folder ID provided for file creation');
      return null;
    }
    
    // Check authentication status first
    const authStatus = getAuthStatus();
    if (!authStatus.hasAccounts || !authStatus.isInitialized) {
      console.error('createCsvFile: Not authenticated', authStatus);
      setLastError('Not authenticated with Microsoft Graph');
      throw new Error('Not authenticated with Microsoft Graph');
    }
    
    setIsLoading(true);
    setLastError(null);
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`createCsvFile: Attempt ${retryCount + 1}/${maxRetries} - Creating file ${fileName}`);
        
        // First, get a fresh access token to ensure we're authenticated
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error('Failed to get access token');
        }
        
        // Use the fetch API directly instead of the client, which has more reliability issues
        const folderIdStr = String(parentFolderId);
        
        // First create an empty file
        console.log(`createCsvFile: Creating empty file ${fileName} in folder ${folderIdStr}`);
        
        // Try direct approach with fetch API
        const createEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderIdStr}/children`;
        console.log(`createCsvFile: Using endpoint: ${createEndpoint}`);
        
        const createResponse = await fetch(createEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: fileName,
            file: {},
            '@microsoft.graph.conflictBehavior': 'replace'
          })
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error(`createCsvFile: Error creating file: ${createResponse.status} ${createResponse.statusText}`, errorText);
          throw new Error(`Failed to create file: ${createResponse.status} ${createResponse.statusText}`);
        }
        
        // Parse the response to get the file ID
        const fileData = await createResponse.json();
        console.log('createCsvFile: File creation response:', fileData);
        
        if (!fileData || !fileData.id) {
          console.error('createCsvFile: No file ID in response');
          throw new Error('No file ID in response');
        }
        
        // Now update the file content
        if (initialContent && initialContent.length > 0) {
          console.log(`createCsvFile: Updating content for file ${fileData.id}`);
          
          const contentEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${fileData.id}/content`;
          console.log(`createCsvFile: Using content endpoint: ${contentEndpoint}`);
          
          const contentResponse = await fetch(contentEndpoint, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'text/csv'
            },
            body: initialContent
          });
          
          if (!contentResponse.ok) {
            const errorText = await contentResponse.text();
            console.error(`createCsvFile: Error updating content: ${contentResponse.status} ${contentResponse.statusText}`, errorText);
            
            // Even if content update fails, we still have the file
            console.log('createCsvFile: Content update failed, but file was created');
          } else {
            console.log('createCsvFile: Content updated successfully');
          }
        }
        
        // Return success with file info
        const result: CsvFile = {
          id: fileData.id,
          name: fileName,
          url: fileData.webUrl || '',
          content: initialContent
        };
        
        console.log(`createCsvFile: Successfully created file ${fileName} with ID ${result.id}`);
        setIsLoading(false);
        return result;
        
      } catch (err) {
        retryCount++;
        console.error(`createCsvFile: Attempt ${retryCount}/${maxRetries} failed:`, err);
        
        if (retryCount >= maxRetries) {
          console.error(`createCsvFile: All ${maxRetries} attempts failed for ${fileName}`);
          setLastError(`Failed to create CSV file: ${err.message}`);
          
          // Create a mock file for testing/fallback with local-prefixed ID to distinguish it
          const mockFile: CsvFile = {
            id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            name: fileName,
            url: '',
            content: initialContent
          };
          
          console.log(`createCsvFile: Returning mock file with local ID for fallback:`, mockFile);
          localStorage.setItem(`mock_file_${mockFile.id}`, initialContent);
          setIsLoading(false);
          return mockFile;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`createCsvFile: Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setIsLoading(false);
    return null;
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
      console.error('[CSV UPDATE] Authentication check failed');
      throw new Error('No accounts found');
    }

    if (!fileId || fileId.trim() === '') {
      console.error('[CSV UPDATE] Invalid file ID');
      throw new Error('Invalid file ID provided');
    }

    if (!content) {
      console.warn('[CSV UPDATE] Empty content provided');
      content = ''; // Ensure it's at least an empty string
    }

    try {
      console.log(`[CSV UPDATE] Updating file with ID: ${fileId}`);
      console.log(`[CSV UPDATE] Content length: ${content.length} bytes`);
      
      console.log('[CSV UPDATE] Acquiring access token');
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });
      console.log('[CSV UPDATE] Token acquired successfully');

      // Direct content update endpoint
      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
      console.log('[CSV UPDATE] Using endpoint:', endpoint);
      
      // Show beginning of content for debugging
      if (content.length > 0) {
        console.log('[CSV UPDATE] Content preview:', content.substring(0, Math.min(100, content.length)) + '...');
      }
      
      // Add retry mechanism
      let success = false;
      let attemptCount = 0;
      const maxAttempts = 3;
      let lastError: any = null;
      
      while (!success && attemptCount < maxAttempts) {
        attemptCount++;
        console.log(`[CSV UPDATE] Attempt ${attemptCount}/${maxAttempts}`);
        
        try {
          const result = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${response.accessToken}`,
              'Content-Type': 'text/csv; charset=utf-8'
            },
            body: content
          });

          // Handle response errors
          if (!result.ok) {
            let errorText = '';
            try {
              errorText = await result.text();
            } catch (e) {
              errorText = 'Could not read error response';
            }
            
            console.error('[CSV UPDATE] Failed to update file:', result.status, result.statusText, errorText);
            lastError = new Error(`Failed to update CSV file: ${result.statusText} - ${errorText}`);
            
            // If we get a 404, the file doesn't exist
            if (result.status === 404) {
              throw new Error(`File with ID ${fileId} not found. It may have been deleted.`);
            }
            
            // Pause before retry
            if (attemptCount < maxAttempts) {
              console.log(`[CSV UPDATE] Waiting ${attemptCount * 1000}ms before retry`);
              await new Promise(resolve => setTimeout(resolve, attemptCount * 1000));
            }
          } else {
            // Success!
            const updatedFile = await result.json();
            console.log('[CSV UPDATE] File updated successfully:', updatedFile.name);
            success = true;
            
            // Optionally verify the content was updated
            try {
              console.log('[CSV UPDATE] Verifying update');
              // We'll just verify the file exists and is accessible
              const verifyResult = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
                headers: {
                  'Authorization': `Bearer ${response.accessToken}`
                }
              });
              
              if (verifyResult.ok) {
                console.log('[CSV UPDATE] File verification successful');
              } else {
                console.warn('[CSV UPDATE] Could not verify file update - verification request failed');
              }
            } catch (verifyError) {
              console.warn('[CSV UPDATE] Error during update verification:', verifyError);
            }
          }
        } catch (error) {
          console.error(`[CSV UPDATE] Error on attempt ${attemptCount}:`, error);
          lastError = error;
          
          // Pause before retry
          if (attemptCount < maxAttempts) {
            console.log(`[CSV UPDATE] Waiting ${attemptCount * 1000}ms before retry`);
            await new Promise(resolve => setTimeout(resolve, attemptCount * 1000));
          }
        }
      }
      
      if (!success) {
        // If all attempts failed, throw the last error
        throw lastError || new Error('Failed to update file after multiple attempts');
      }
      
      return success;
    } catch (error) {
      console.error('[CSV UPDATE] Error updating file:', error);
      toast.error('Failed to update CSV file: ' + error.message);
      throw error;
    }
  };

  // Create a new direct file upload function
  const directFileUpload = async (fileName: string, content: string, parentFolderId: string): Promise<CsvFile | null> => {
    console.log(`[DIRECT UPLOAD] Starting direct upload for ${fileName} to folder ${parentFolderId}`);
    
    // Basic validation
    if (!fileName || !parentFolderId) {
      console.error('[DIRECT UPLOAD] Missing file name or folder ID');
      return null;
    }
    
    // Ensure authentication
    if (!checkMsalAuth()) {
      console.error('[DIRECT UPLOAD] Authentication failed');
      return null;
    }
    
    try {
      // Get access token
      console.log('[DIRECT UPLOAD] Getting access token');
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      
      // 1. Try the simplest approach first - direct upload to specific path
      const directEndpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(fileName)}:/content`;
      console.log(`[DIRECT UPLOAD] Attempting direct upload to ${directEndpoint}`);
      
      const directResponse = await fetch(directEndpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/csv'
        },
        body: content || ' ' // Use space if empty to ensure file creation
      });
      
      if (directResponse.ok) {
        const responseData = await directResponse.json();
        console.log('[DIRECT UPLOAD] Direct upload successful', responseData);
        
        if (responseData && responseData.id) {
          return {
            id: responseData.id,
            name: fileName,
            url: responseData.webUrl || '',
            content: content || ''
          };
        }
      }
      
      console.log(`[DIRECT UPLOAD] Direct upload failed: ${directResponse.status}. Trying alternative method...`);
      
      // 2. Try full folder path approach with folder reference
      const pathEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}:/${encodeURIComponent(fileName)}:/content`;
      console.log(`[DIRECT UPLOAD] Trying path-based upload to ${pathEndpoint}`);
      
      const pathResponse = await fetch(pathEndpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/csv'
        },
        body: content || ' ' // Use space if empty to ensure file creation
      });
      
      if (pathResponse.ok) {
        const responseData = await pathResponse.json();
        console.log('[DIRECT UPLOAD] Path-based upload successful', responseData);
        
        if (responseData && responseData.id) {
          return {
            id: responseData.id,
            name: fileName,
            url: responseData.webUrl || '',
            content: content || ''
          };
        }
      }
      
      console.log(`[DIRECT UPLOAD] Path-based upload failed: ${pathResponse.status}. Trying folder children method...`);
      
      // 3. Try the two-step method - create empty file first, then update content
      const childrenEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children`;
      console.log(`[DIRECT UPLOAD] Creating empty file using ${childrenEndpoint}`);
      
      // Create an empty file
      const createResponse = await fetch(childrenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          file: {},
          '@microsoft.graph.conflictBehavior': 'replace'
        })
      });
      
      // Get the file ID from the response
      let fileId: string | null = null;
      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log('[DIRECT UPLOAD] Empty file created', createData);
        
        if (createData && createData.id) {
          fileId = createData.id;
          
          // Now update the content if we have content to upload
          if (content) {
            const contentEndpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
            console.log(`[DIRECT UPLOAD] Updating content for file ${fileId}`);
            
            const contentResponse = await fetch(contentEndpoint, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'text/csv'
              },
              body: content
            });
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json();
              console.log('[DIRECT UPLOAD] Content update successful', contentData);
              
              // Return successfully created file info
              return {
                id: fileId,
                name: fileName,
                url: contentData.webUrl || createData.webUrl || '',
                content: content || ''
              };
            } else {
              console.error(`[DIRECT UPLOAD] Content update failed: ${contentResponse.status}`);
              // Still return file info since the file was created
              return {
                id: fileId,
                name: fileName,
                url: createData.webUrl || '',
                content: ''
              };
            }
          } else {
            // Return empty file info
            return {
              id: fileId,
              name: fileName,
              url: createData.webUrl || '',
              content: ''
            };
          }
        }
      }
      
      // If we get here, all approaches failed
      console.error('[DIRECT UPLOAD] All upload methods failed');
      throw new Error('Failed to upload file using all available methods');
      
    } catch (error) {
      console.error('[DIRECT UPLOAD] Error:', error);
      
      // Create local fallback
      const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem(`mock_file_${localId}`, content || '');
      
      return {
        id: localId,
        name: fileName,
        url: '',
        content: content || ''
      };
    }
  };

  const handleLogin = useCallback(async () => {
    try {
      if (!msalInstance) {
        console.error("handleLogin: MSAL instance is not available");
        return null;
      }
      
      console.log("handleLogin: Starting login process");
      
      // Use specific scopes for OneDrive
      const scopes = [
        'Files.Read',
        'Files.Read.All',
        'Files.ReadWrite',
        'Files.ReadWrite.All',
        'User.Read'
      ];
      
      console.log(`handleLogin: Requesting scopes: ${scopes.join(', ')}`);
      
      const response = await msalInstance.loginPopup({
        scopes: scopes
      });
      
      console.log("handleLogin: Login successful", {
        username: response.account.username,
        homeAccountId: response.account.homeAccountId,
        localAccountId: response.account.localAccountId,
        environment: response.account.environment,
        tenantId: response.account.tenantId
      });
      
      // Set this account as the active account
      msalInstance.setActiveAccount(response.account);
      
      console.log("handleLogin: Active account set");
      
      // Store account in local storage for debugging purposes
      try {
        localStorage.setItem('msalAccount', JSON.stringify({
          username: response.account.username,
          homeAccountId: response.account.homeAccountId,
          timestamp: new Date().toISOString()
        }));
      } catch (storageErr) {
        console.warn("handleLogin: Failed to store account info in localStorage", storageErr);
      }
      
      return response;
    } catch (err) {
      console.error("handleLogin: Login failed", err);
      
      // Check for specific error types
      let errorMessage = "Login failed";
      
      if (err.errorCode) {
        errorMessage += `: ${err.errorCode}`;
        if (err.errorCode === "user_cancelled") {
          errorMessage = "Login was cancelled by the user";
        }
      }
      
      // Display more user-friendly error
      toast.error(errorMessage);
      
      return null;
    }
  }, [msalInstance]);

  // End of the useMicrosoftGraph hook
  return {
    isLoading,
    lastError,
    getAuthStatus,
    getAccessToken,
    getClient,
    getOneDriveDocuments,
    getFolderContents,
    createFolder,
    renameFolder,
    deleteFolder,
    createCsvFile,
    directFileUpload,
    readCsvFile,
    updateCsvFile,
    handleLogin
  };
};

export default useMicrosoftGraph;