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
  source: 'OneDrive' | 'SharePoint';
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

  const getClient = useCallback(async (): Promise<Client | null> => {
    const accessToken = await getAccessToken();
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }, [getAccessToken]);

  // --- SharePoint Specific Functions (Placeholders) ---
  const getSharePointDocuments = async (): Promise<Document[] | null> => {
    console.warn("getSharePointDocuments not implemented yet.");
    return []; 
  };

  const getSharePointFolderContents = async (folderId: string): Promise<Document[] | null> => {
    console.warn(`getSharePointFolderContents not implemented yet for folder: ${folderId}`);
    return [];
  };

  // --- OneDrive Specific Functions ---
  const getOneDriveRootDocuments = useCallback(async (): Promise<Document[] | null> => {
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
  }, [checkMsalAuth, getClient, setIsLoading, setLastError, toast]);

  const getOneDriveFolderContents = useCallback(async (folderId: string): Promise<Document[] | null> => {
    console.log(`getOneDriveFolderContents called for folderId: ${folderId}`);
    if (!folderId) {
      console.error("getOneDriveFolderContents called without a folderId specified.");
      setLastError("Folder ID is required to fetch folder contents.");
      toast.error("Cannot fetch folder contents: Folder ID missing.");
      return null;
    }

    try {
      console.log(`getOneDriveFolderContents: Acquiring token for folder ${folderId}`);
      const client = await getClient();
      if (!client) {
        console.error('getOneDriveFolderContents: Client not initialized');
        setLastError('Client not initialized');
        return null;
      }

      console.log(`getOneDriveFolderContents: Using client for folder ${folderId}`);

      // Corrected: Use client.api directly, it handles auth
      const response = await client.api(`/me/drive/items/${folderId}/children`)
        .select('id,name,webUrl,lastModifiedDateTime,size,folder,parentReference')
        .get();
        
      console.log(`OneDrive folder ${folderId} response:`, response);

      if (response && response.value) {
        // Filter to include all folders
        const filteredItems = response.value.filter(item => 
          // Include all folders and specific file types
          item.folder || 
          (item.name && (item.name.endsWith('.csv') || item.name.endsWith('.xlsx')))
        );
        
        console.log(`getOneDriveFolderContents: Filtered to ${filteredItems.length} relevant items`);
        
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
      } else {
        // Handle empty folders gracefully or throw error
         if (response && response.value === undefined) {
           console.log(`Folder ${folderId} appears to be empty.`);
           setIsLoading(false);
           return [];
        }
        throw new Error("Invalid response structure from OneDrive folder fetch");
      }
    } catch (error: any) {
      console.error('Error fetching OneDrive folder contents:', error);
      setLastError(`Error fetching OneDrive folder contents: ${error.message}`);
      toast.error('Failed to fetch OneDrive folder contents');
      return null;
    }
  }, [checkMsalAuth, getClient, setIsLoading, setLastError, toast]);

  // --- Generic Functions ---
  const getFolderContents = useCallback(async (folderId: string, source: 'OneDrive' | 'SharePoint'): Promise<Document[] | null> => {
    console.log(`getFolderContents called for folderId: ${folderId}, source: ${source}`);
    if (!source) {
        console.error("getFolderContents called without a source specified.");
        setLastError("Source type (OneDrive/SharePoint) is required to fetch folder contents.");
        toast.error("Cannot fetch folder contents: Source type missing.");
        return null;
    }
    if (!folderId) {
         console.error("getFolderContents called without a folderId specified.");
        setLastError("Folder ID is required to fetch folder contents.");
        toast.error("Cannot fetch folder contents: Folder ID missing.");
        return null;
    }

    switch (source) {
      case 'OneDrive':
        return getOneDriveFolderContents(folderId);
      case 'SharePoint':
        // Call the SharePoint specific function once implemented
        return getSharePointFolderContents(folderId);
      default:
        console.error(`Unsupported source type in getFolderContents: ${source}`);
        setLastError(`Unsupported source type: ${source}`);
        toast.error(`Cannot fetch folder contents: Unsupported source ${source}.`);
        return null;
    }
  }, [getOneDriveFolderContents, getSharePointFolderContents]);

  // --- CSV File Specific Functions ---
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
  }, [getClient, checkMsalAuth, toast, setIsLoading, setLastError]);

  const renameFolder = useCallback(async (folderId: string, newName: string): Promise<boolean> => {
    if (!checkMsalAuth()) {
       const status = getAuthStatus();
       const errorMsg = status.error || 'Authentication check failed.';
       setLastError(`Rename folder error: ${errorMsg}`);
       toast.error(`Failed to rename folder: ${errorMsg}`);
       return false;
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

      console.log(`Folder renamed successfully to '${newName}' (ID: ${folderId})`);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error renaming folder:', error);
      const errorMsg = error.message || 'Unknown rename error';
      setLastError(`Rename folder error: ${errorMsg}`);
      toast.error('Failed to rename folder');
      setIsLoading(false);
      return false;
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
  const createCsvFile = async (
    fileName: string, 
    initialContent: string = '', 
    parentFolderIdInput?: string | null | unknown
  ): Promise<CsvFile | null> => {
    // Ensure parentFolderId is treated as string, defaulting to undefined if not string
    const parentFolderId: string | undefined = typeof parentFolderIdInput === 'string' ? parentFolderIdInput : undefined;
    const targetFolderId = parentFolderId || 'root'; // Use 'root' if parentFolderId is undefined

    if (!checkMsalAuth()) {
      console.error('[CSV CREATE] Auth check failed');
      setLastError('Authentication required to create file.');
      toast.error('Authentication failed');
      return null;
    }
    if (!fileName || fileName.trim() === '') {
      console.error('[CSV CREATE] Invalid file name');
      setLastError('File name cannot be empty');
      toast.error('Invalid file name');
      return null;
    }

    setIsLoading(true);
    setLastError(null);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get Graph client');

      // targetFolderId is guaranteed to be a string here ('root' or a valid ID)
      const endpoint = targetFolderId === 'root'
        ? `/me/drive/root:/${fileName}:/content`
        : `/me/drive/items/${targetFolderId}:/${fileName}:/content`;

      console.log(`[CSV CREATE] Uploading to endpoint: ${endpoint}`);

      const response = await client.api(endpoint)
        .header('Content-Type', 'text/csv')
        .put(initialContent);

      console.log('[CSV CREATE] File upload response:', response);

      const newFile: CsvFile = {
        id: response.id,
        name: response.name,
        url: response.webUrl,
      };

      toast.success(`File '${fileName}' created successfully.`);
      setIsLoading(false);
      return newFile;

    } catch (error: any) {
      console.error('[CSV CREATE] Error creating file:', error);
      setLastError(`Error creating CSV file: ${error.message}`);
      toast.error(`Failed to create file: ${error.message}`);
      setIsLoading(false);
      return null;
    }
  };

  const readCsvFile = async (fileIdInput: string | null | undefined): Promise<string> => {
    if (typeof fileIdInput !== 'string' || !fileIdInput) { // Stricter check
      console.error("readCsvFile called with invalid fileId:", fileIdInput);
      setLastError("Invalid file ID provided.");
      toast.error("Cannot read file: Invalid file ID.");
      return ''; 
    }
    // Now TypeScript knows fileId is a string
    const fileId: string = fileIdInput;

    if (!checkMsalAuth()) {
       console.error('[CSV READ] Auth check failed');
       setLastError('Authentication required to read file.');
       toast.error('Authentication failed');
       return ''; // Return empty string on error
    }

    setIsLoading(true);
    setLastError(null);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get Graph client');

      // fileId is guaranteed to be a string here
      const response = await client.api(`/me/drive/items/${fileId}/content`)
        .header('Accept', 'text/csv, text/plain') // Accept CSV or plain text
        .get();
        
      // MS Graph returns the content directly for .get() on /content
      // Check if the response is a string (content) or an object (error?)
      if (typeof response === 'string') {
          console.log(`[CSV READ] Successfully read content for file ID: ${fileId}`);
          setIsLoading(false);
          return response;
      } else {
          // If it's not a string, it might be an error object or unexpected format
          console.warn(`[CSV READ] Unexpected response type for file ${fileId}:`, response);
          // Attempt to read blob if applicable (might indicate non-text file was requested)
          if (response instanceof Blob) {
              try {
                  const textContent = await response.text();
                  console.log(`[CSV READ] Read content as Blob text for file ID: ${fileId}`);
                  setIsLoading(false);
                  return textContent;
              } catch (blobError) {
                  console.error(`[CSV READ] Error reading Blob content for file ${fileId}:`, blobError);
                  throw new Error('Failed to read file content as text.');
              }
          }
          throw new Error('Unexpected response format when reading file content.');
      }

    } catch (error: any) {
      console.error(`[CSV READ] Error reading file ${fileId}:`, error);
      setLastError(`Error reading CSV file: ${error.message}`);
      toast.error(`Failed to read file: ${error.message}`);
      setIsLoading(false);
      return ''; // Return empty string on error
    }
  };

  const updateCsvFile = async (fileIdInput: string | null | undefined, content: string): Promise<boolean> => {
     if (typeof fileIdInput !== 'string' || !fileIdInput) { // Stricter check
        console.error("updateCsvFile called with invalid fileId:", fileIdInput);
        setLastError("Invalid file ID provided.");
        toast.error("Cannot update file: Invalid file ID.");
        return false; 
    }
    // Now TypeScript knows fileId is a string
    const fileId: string = fileIdInput;

    if (!checkMsalAuth()) {
      console.error('[CSV UPDATE] Authentication check failed');
      setLastError('Authentication required to update file.');
      toast.error('Authentication failed');
      return false;
    }
    if (content === undefined || content === null) { // Check for undefined/null content
      console.error('[CSV UPDATE] Content cannot be null or undefined');
      setLastError('Content cannot be empty for update.');
      toast.error('Invalid content for file update');
      return false;
    }

    setIsLoading(true);
    setLastError(null);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get Graph client');

      // fileId is guaranteed to be a string here
      const response = await client.api(`/me/drive/items/${fileId}/content`)
        .header('Content-Type', 'text/csv')
        .put(content);

      console.log('[CSV UPDATE] File update response:', response);

      // Check if the response indicates success (e.g., has an ID or name)
      if (response && response.id) {
        toast.success(`File '${response.name || fileId}' updated successfully.`);
        setIsLoading(false);
        return true;
      } else {
        console.warn('[CSV UPDATE] Update might have succeeded but response format unexpected:', response);
        // Assume success if no error thrown, but log warning
        toast.info('File update completed, but response format was unexpected.');
        setIsLoading(false);
        return true; 
      }

    } catch (error: any) {
      console.error(`[CSV UPDATE] Error updating file ${fileId}:`, error);
      setLastError(`Error updating CSV file: ${error.message}`);
      toast.error(`Failed to update file: ${error.message}`);
      setIsLoading(false);
      return false;
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
    getOneDriveDocuments: getOneDriveRootDocuments,
    getFolderContents,
    createFolder,
    renameFolder,
    deleteFolder,
    createCsvFile,
    directFileUpload,
    readCsvFile,
    updateCsvFile,
    handleLogin,
    getSharePointDocuments,
    getSharePointFolderContents
  };
};

export default useMicrosoftGraph;