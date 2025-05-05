import { useState, useCallback, useRef } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from 'sonner';
import { useMsal } from '@azure/msal-react';
import { Client } from '@microsoft/microsoft-graph-client';
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';

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
  const { user } = useSupabaseAuth();
  const { instance: msalInstance, inProgress } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRequestLocked, setIsRequestLocked] = useState(false);
  const [hasFetchAttempted, setHasFetchAttempted] = useState(false);
  const fetchTimeoutRef = useRef<any>(null);

  const checkMsalAuth = useCallback(() => {
    if (inProgress !== InteractionStatus.None) {
      console.warn('checkMsalAuth: MSAL interaction is in progress. Status:', inProgress);
      setLastError('Authentication system busy, please wait.');
      return false;
    }

    if (!msalInstance) {
      console.error('MSAL instance not found via useMsal hook');
      setLastError('MSAL instance not found - authentication service not initialized');
      return false;
    }
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      console.error('No accounts found in MSAL instance.');
      return false;
    }
    
    if (!msalInstance.getActiveAccount() && accounts.length > 0) {
      console.log('Setting active account to:', accounts[0].username);
      msalInstance.setActiveAccount(accounts[0]);
    }
    
    console.log("checkMsalAuth: MSAL auth check passed.");
    return true;
  }, [msalInstance, inProgress]);

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
    console.log("getAccessToken: Starting token acquisition attempt.");
    
    if (inProgress !== InteractionStatus.None) {
      console.warn('getAccessToken: MSAL interaction is in progress. Aborting token acquisition. Status:', inProgress);
      throw new Error('MSAL is busy. Please try again shortly.');
    }

    try {
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
      }
      
      if (activeAccount) {
          console.log(`getAccessToken: Using account ${activeAccount.username}`);
      } else {
          console.warn("getAccessToken: No active account set, acquireTokenSilent may fail or prompt interaction.");
      }
      
      // 4. Define scopes
      const oneDriveScopes = [
        'Files.Read',
        'Files.Read.All',
        'Files.ReadWrite',
        'Files.ReadWrite.All',
        'Sites.Read.All',
        'User.Read'
      ];
      
      console.log(`getAccessToken: Requesting token scopes: ${oneDriveScopes.join(', ')}`);
      
      // --- Silent Token Acquisition Attempt ---
      try {
        console.log("getAccessToken: Attempting acquireTokenSilent...");
        const response = await msalInstance.acquireTokenSilent({
          scopes: oneDriveScopes,
          account: activeAccount
        });
        console.log("getAccessToken: Successfully acquired token silently.");
        return response.accessToken;
      } catch (silentError) {
        console.warn("getAccessToken: acquireTokenSilent failed. Error:", silentError);
        
        // --- Popup Token Acquisition Attempt ---
        if (silentError instanceof InteractionRequiredAuthError) {
           console.log("getAccessToken: Silent acquisition failed due to InteractionRequiredAuthError. Attempting acquireTokenPopup...");
           try {
            const response = await msalInstance.acquireTokenPopup({
              scopes: oneDriveScopes
            });
            console.log("getAccessToken: Successfully acquired token via popup.");
            return response.accessToken;
          } catch (popupError) {
            console.error("getAccessToken: acquireTokenPopup failed. Error:", popupError);
            // Fall through to the final error throw below
          }
        } else {
          console.error("getAccessToken: acquireTokenSilent failed with non-interaction error:", silentError);
          // Fall through to the final error throw below
        }
        
        // If all attempts fail, throw the last significant error
        console.error("getAccessToken: All token acquisition attempts failed.");
        // Rethrow the specific error that occurred (silent or popup)
        throw silentError; // Or handle popupError if you want to prioritize it
      }
    } catch (err: any) { // Added ': any' for broader error handling
      console.error('getAccessToken: Catch block reached. Final error:', err);
      // Create a more user-friendly error
      const errorMessage = err.message || 'Unknown error';
      const userFriendlyError = new Error(
        `Failed to get Microsoft access token: ${errorMessage}. Try logging out and back in.`
      );
      // Preserve the original stack trace for debugging
      userFriendlyError.stack = err.stack;
      setLastError(userFriendlyError.message); // Update lastError state
      throw userFriendlyError; // Rethrow the formatted error
    }
  }, [msalInstance, inProgress]);

  const getClient = useCallback(async (): Promise<Client | null> => {
    console.log("getClient: Attempting to get MS Graph client...");
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
         console.error("getClient: Failed to get access token. Cannot initialize client.");
         return null;
      }
      console.log("getClient: Access token obtained, initializing Graph client.");
      return Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });
    } catch (error) {
        console.error("getClient: Error during access token retrieval or client initialization:", error);
        setLastError(`Failed to initialize connection: ${error.message}`);
        return null;
    }
  }, [getAccessToken]);

  // --- OneDrive Specific Functions ---
  const getOneDriveRootDocuments = useCallback(async (): Promise<Document[] | null> => {
    console.log('getOneDriveRootDocuments: Attempting to get root documents...');
    setIsLoading(true);
    setLastError(null);

    if (!checkMsalAuth()) {
      console.error('getOneDriveRootDocuments: Auth check failed via checkMsalAuth.');
      setIsLoading(false);
      // setLastError is handled by checkMsalAuth or getAccessToken
      return null; 
    }

    if (!msalInstance.getActiveAccount()) {
        console.error('getOneDriveRootDocuments: No active account found in MSAL instance.');
        setLastError('No active Microsoft account. Please sign in.');
        // We might not need setIsRequestLocked here if we return null immediately
        return null;
    }

    if (isRequestLocked) {
      console.log('Request already in progress, skipping duplicate request');
      return null;
    }
    
    setIsRequestLocked(true);
    setIsLoading(true);
    setLastError(null); // Clear previous errors
    
    // Clear any existing fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    try {
      console.log("getOneDriveRootDocuments: Getting Graph client...");
      const client = await getClient();
      if (!client) {
        console.error("getOneDriveRootDocuments: Failed to get Graph client.");
        // setLastError should be handled by getClient
        setIsLoading(false);
        return null;
      }
      console.log("getOneDriveRootDocuments: Graph client obtained. Calling Graph API for root drive items...");
      const response = await client.api('/me/drive/root/children').select('id,name,webUrl,lastModifiedDateTime,size,folder,parentReference').get();
      console.log("getOneDriveRootDocuments: Graph API response received.");
      const documents: Document[] = response.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl,
        lastModified: item.lastModifiedDateTime,
        size: item.size,
        isFolder: !!item.folder,
        parentReference: item.parentReference,
        source: 'OneDrive',
      }));
      console.log(`getOneDriveRootDocuments: Processed ${documents.length} items.`);
      setIsLoading(false);
      setIsRequestLocked(false);
      return documents;
    } catch (error: any) {
      console.error('getOneDriveRootDocuments: Error fetching documents:', error);
      setLastError(`Failed to get OneDrive documents: ${error.message || 'Unknown error'}`);
      toast.error(`Failed to fetch OneDrive documents: ${error.message}`);
      setIsLoading(false);
      setIsRequestLocked(false);
      return null;
    }
  }, [checkMsalAuth, getClient, setIsLoading, setLastError, toast, isRequestLocked, msalInstance]);

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

  // --- Generic Functions (Now OneDrive specific) ---
  const getFolderContents = useCallback(async (folderId: string): Promise<Document[] | null> => {
    console.log(`getFolderContents (OneDrive) called for folderId: ${folderId}`);
    // Directly call the OneDrive specific function
    return getOneDriveFolderContents(folderId);
  }, [getOneDriveFolderContents]); // Depend only on the OneDrive function

  // --- CSV/Folder Management Functions (Assume they target OneDrive) ---
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

  // --- SharePoint Upload Function ---
  const uploadFileToSharePointLibrary = useCallback(
    async (file: File): Promise<string | null> => {
      const siteHostname = "scpng1.sharepoint.com"; // Consider making these configurable
      const sitePath = "/sites/scpngintranet";
      const libraryName = "Asset Images"; // The target Document Library OR Folder name

      console.log(
        `uploadFileToSharePointLibrary: Attempting to upload '${file.name}' to site '${sitePath}', library '${libraryName}'...`
      );
      setIsLoading(true);
      setLastError(null);

      if (!checkMsalAuth()) {
        setIsLoading(false);
        // Error state set by checkMsalAuth or getAccessToken
        return null;
      }

      let client: Client | null = null;
      let siteId = '';
      let driveId: string | null = null;
      let finalFilePath = ''; // Path relative to the drive root used for getting webUrl
      let uploadSuccessful = false;

      try {
        client = await getClient();
        if (!client) throw new Error("Failed to initialize Graph client.");

        // --- 1. Get Site ID ---
        const siteInfoUrl = `/sites/${siteHostname}:${sitePath}`;
        console.log(`uploadFileToSharePointLibrary: Getting site ID from ${siteInfoUrl}`);
        const siteInfoResponse = await client.api(siteInfoUrl).select('id').get();
        siteId = siteInfoResponse.id;
        if (!siteId) throw new Error("Could not retrieve SharePoint Site ID.");
        console.log(`uploadFileToSharePointLibrary: Found Site ID: ${siteId}`);

        // --- 2. Try Primary Path: Get Library's Drive ID ---
        const driveInfoUrl = `/sites/${siteId}/lists/${encodeURIComponent(libraryName)}/drive`;
        try {
          console.log(`uploadFileToSharePointLibrary: Attempting to get Drive ID for library '${libraryName}' from ${driveInfoUrl}`);
          const driveInfoResponse = await client.api(driveInfoUrl).select('id').get();
          driveId = driveInfoResponse.id;
          if (!driveId) {
             // This case should ideally not happen if the request succeeds but ID is missing
             console.warn(`uploadFileToSharePointLibrary: Drive ID lookup for library '${libraryName}' succeeded but returned no ID. Proceeding with fallback.`);
          } else {
             console.log(`uploadFileToSharePointLibrary: Found Drive ID for library: ${driveId}`);
          }
        } catch (driveError: any) {
           console.warn(`uploadFileToSharePointLibrary: Failed to get Drive ID for library '${libraryName}'. Error: ${driveError.message}. Proceeding with fallback upload to folder.`);
           // driveId remains null
        }

        // --- 3. Determine Upload URL and Path for Web URL ---
        const encodedFileName = encodeURIComponent(file.name);
        let uploadUrl: string;

        if (driveId) {
          // Primary: Upload to the root of the specific library's drive
          uploadUrl = `/sites/${siteId}/drives/${driveId}/root:/${encodedFileName}:/content`;
          finalFilePath = encodedFileName; // Path relative to drive root
          console.log(`uploadFileToSharePointLibrary: Using PRIMARY upload URL (Library Drive): ${uploadUrl}`);
        } else {
          // Fallback: Upload to a folder named {libraryName} in the site's default drive
          uploadUrl = `/sites/${siteId}/drive/root:/${encodeURIComponent(libraryName)}/${encodedFileName}:/content`;
          finalFilePath = `${encodeURIComponent(libraryName)}/${encodedFileName}`; // Path relative to default drive root
          console.log(`uploadFileToSharePointLibrary: Using FALLBACK upload URL (Default Drive Folder): ${uploadUrl}`);
        }

        // --- 4. Perform Upload ---
        console.log(`uploadFileToSharePointLibrary: Uploading ${file.name} via PUT to ${uploadUrl}`);
        const response = await client!.api(uploadUrl)
            .header('Content-Type', file.type)
            // Add conflict behavior if needed: .header('@microsoft.graph.conflictBehavior', 'rename')
            .put(file); // Directly pass the File object

        // Check response? Graph client throws on non-2xx. If we reach here, it's likely a 200 or 201.
        console.log(`uploadFileToSharePointLibrary: Upload API call successful for ${file.name}. Response status info (if available):`, response?.status); // Response might be minimal on success
        uploadSuccessful = true;

        // --- 5. Get Web URL ---
        if (uploadSuccessful) {
           console.log(`uploadFileToSharePointLibrary: Upload successful, retrieving Web URL for path: '${finalFilePath}' (relative to ${driveId ? `Drive ${driveId}` : 'Default Drive'})`);
           const webUrl = await getFileWebUrl(client, siteId, driveId, finalFilePath); // Pass client, siteId, driveId

           if (webUrl) {
               console.log(`uploadFileToSharePointLibrary: Successfully retrieved Web URL: ${webUrl}`);
               setIsLoading(false);
               return webUrl;
           } else {
               // Error handled within getFileWebUrl, just return null
               console.error(`uploadFileToSharePointLibrary: Upload completed but failed to retrieve the direct link.`);
               setLastError("Upload completed but failed to retrieve the direct link."); // Set error state
               setIsLoading(false);
               return null;
           }
        } else {
           // This part should technically not be reached if client.api().put() throws on failure
           throw new Error("Upload seemed to succeed according to control flow, but 'uploadSuccessful' flag was not set.");
        }

      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error during SharePoint upload.';
        console.error(
          `uploadFileToSharePointLibrary: Error uploading file '${file.name}': ${errorMessage}`, error?.body || error // Log full error if possible
        );
        // Attempt to extract Graph specific error details
        let graphErrorDetails = '';
        if (error.statusCode && error.code && error.message) {
            graphErrorDetails = ` (Code: ${error.code}, Status: ${error.statusCode})`;
        } else if (error.body && typeof error.body === 'string') {
            try {
                const errorBody = JSON.parse(error.body);
                if (errorBody?.error?.message) {
                    graphErrorDetails = ` (${errorBody.error.message})`;
                }
            } catch { /* Ignore parsing errors */ }
        }
        setLastError(`Failed to upload file to SharePoint: ${errorMessage}${graphErrorDetails}`);
        setIsLoading(false);
        return null;
      }
    },
    [checkMsalAuth, getClient, setIsLoading, setLastError] // Removed toast dependency unless added back
  );

  // --- Helper to get Web URL (modified to accept client and ids) ---
  const getFileWebUrl = useCallback(
    async (client: Client | null, siteId: string, driveId: string | null, filePath: string): Promise<string | null> => {
      if (!client || !siteId || !filePath) {
         console.error("getFileWebUrl: Missing required arguments (client, siteId, or filePath).");
         // Avoid setting lastError here as the caller function should handle it
         return null;
      }

      let metadataUrl: string;
      if (driveId) {
          // File is in a specific library drive
          metadataUrl = `/sites/${siteId}/drives/${driveId}/root:/${filePath}`;
      } else {
          // File is in the default site drive (fallback path was used for upload)
          metadataUrl = `/sites/${siteId}/drive/root:/${filePath}`;
      }
      console.log("getFileWebUrl: Fetching metadata from URL:", metadataUrl);

      try {
          const response = await client.api(metadataUrl).select('webUrl').get();
          console.log("getFileWebUrl: Metadata Response:", response);
          if (!response?.webUrl) {
             console.warn("getFileWebUrl: Metadata retrieved but 'webUrl' property is missing.", response);
             // Set error state in the calling function if needed
             return null;
          }
          return response.webUrl;
      } catch (error: any) {
          const errorMessage = error.message || 'Unknown error retrieving file metadata.';
          console.error(`getFileWebUrl: Failed to get file metadata from ${metadataUrl}: ${errorMessage}`, error?.body || error);
          // Let the calling function (uploadFileToSharePointLibrary) handle setting lastError
          return null;
      }
    },
    [] // No dependencies needed inside this specific helper if client/ids are passed in
  );

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
    uploadFileToSharePointLibrary,
  };
};

export default useMicrosoftGraph;