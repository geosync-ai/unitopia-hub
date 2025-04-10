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
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      // Make sure parentFolderId is a string if present
      const folderId = parentFolderId ? String(parentFolderId) : undefined;
      
      console.log('Creating CSV file:', fileName, 'in folder:', folderId);
      
      // Validate the folder ID
      if (!folderId) {
        console.warn('No folder ID provided, file will be created in the root folder');
      } else {
        console.log('Parent folder ID validated:', folderId);
      }
      
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const baseEndpoint = 'https://graph.microsoft.com/v1.0/me/drive';
      const endpoint = folderId 
        ? `${baseEndpoint}/items/${folderId}/children`
        : `${baseEndpoint}/root/children`;

      console.log('Using Graph API endpoint:', endpoint);

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
        
        // Check specifically for folder not found errors
        if (result.status === 404) {
          throw new Error(`Folder not found (${folderId}). Please select a valid folder.`);
        }
        
        throw new Error(`Failed to create CSV file: ${result.statusText} - ${errorText}`);
      }

      const data = await result.json();
      console.log('CSV file created successfully with ID:', data.id, 'Name:', data.name, 'in folder:', folderId);
      
      // If initial content is provided, update the file with it
      if (initialContent) {
        console.log('Updating CSV file with initial content, length:', initialContent.length);
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
      toast.error(`Failed to create CSV file: ${error.message}`);
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
    getAuthStatus,
    handleLogin
  };
};

// Add global type definition for the MSAL instance
declare global {
  interface Window {
    msalInstance: any;
  }
}

export default useMicrosoftGraph;