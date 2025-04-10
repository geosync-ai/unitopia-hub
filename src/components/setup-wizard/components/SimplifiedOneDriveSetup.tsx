import React, { useState, useEffect, useCallback } from 'react';
import { PublicClientApplication, InteractionRequiredAuthError, AccountInfo } from '@azure/msal-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { OneDriveConfig } from '../types';
import { Loader2, Folder, FolderPlus, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import microsoftAuthConfig from '@/config/microsoft-auth'; // Import config

// --- Types --- (Mostly internal to this component now)
interface OneDriveItem {
  id: string;
  name: string;
  webUrl: string;
  folder?: {}; // Indicates it's a folder
  parentReference?: { path: string };
}

interface OneDriveFolder {
  id: string;
  name: string;
  isFolder: true;
  path?: string;
}

// Props definition remains the same
interface SimplifiedOneDriveSetupProps {
  onComplete: (config: OneDriveConfig) => void;
}

// --- MSAL Configuration --- (Directly from config file)
const msalConfig = {
  auth: {
    clientId: microsoftAuthConfig.clientId,
    authority: microsoftAuthConfig.authorityUrl,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : "https://unitopia-hub.vercel.app", // Use dynamic origin
  },
  cache: {
    cacheLocation: 'sessionStorage', // or 'localStorage'
    storeAuthStateInCookie: false,
  }
};

// Define the scopes needed for folder operations
const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite.All"] // Keep scopes minimal for this step
};

// --- Component --- 
const SimplifiedOneDriveSetup: React.FC<SimplifiedOneDriveSetupProps> = ({ onComplete }) => {
  const { toast } = useToast();

  // --- State for MSAL and Component Logic ---
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null); // Store the logged-in account
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading until MSAL initializes
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<OneDriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<OneDriveFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeletingFolderId, setIsDeletingFolderId] = useState<string | null>(null);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false); // Prevent overlapping popups

  // --- MSAL Initialization Effect ---
  useEffect(() => {
    console.log("[SimplifiedOneDriveSetup] Initializing MSAL...");
    const instance = new PublicClientApplication(msalConfig);
    instance.initialize().then(() => {
      setMsalInstance(instance);
      // Check if already logged in
      const currentAccounts = instance.getAllAccounts();
      if (currentAccounts.length > 0) {
        console.log("[SimplifiedOneDriveSetup] User already logged in.");
        setAccount(currentAccounts[0]);
        setIsAuthenticated(true);
        fetchRootFolders(instance, currentAccounts[0]); // Fetch folders immediately
      } else {
        console.log("[SimplifiedOneDriveSetup] No existing login found.");
        setIsLoading(false); // Stop loading if not logged in
      }
    }).catch(err => {
      console.error("[SimplifiedOneDriveSetup] MSAL initialization error:", err);
      setError(`MSAL initialization failed: ${err.message}`);
      setIsLoading(false);
    });

    // Handle redirect promise if needed (though we primarily use popup)
    instance.handleRedirectPromise().catch(err => {
        console.error("[SimplifiedOneDriveSetup] Redirect promise error:", err);
        setError(`Authentication redirect failed: ${err.message}`);
        setIsLoading(false);
        setIsAuthInProgress(false);
    });

  }, []); // Run only once on mount

  // --- Helper: Get Access Token --- 
  const getAccessToken = useCallback(async (instance: PublicClientApplication, currentAccount: AccountInfo): Promise<string | null> => {
    if (!instance || !currentAccount) return null;

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: currentAccount
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Fallback to popup if interaction required
        if (isAuthInProgress) {
             console.warn("[SimplifiedOneDriveSetup] Token acquisition popup already in progress.");
             return null; 
        }
        setIsAuthInProgress(true);
        try {
          const response = await instance.acquireTokenPopup(loginRequest);
          setIsAuthInProgress(false);
          return response.accessToken;
        } catch (popupError) {
          setIsAuthInProgress(false);
          console.error("[SimplifiedOneDriveSetup] Popup token acquisition failed:", popupError);
          setError(`Failed to get token interactively: ${popupError.message}`);
          return null;
        }
      } else {
        console.error("[SimplifiedOneDriveSetup] Silent token acquisition failed:", error);
        setError(`Failed to get token: ${error.message}`);
        return null;
      }
    }
  }, [isAuthInProgress]);

  // --- Core Logic Callbacks ---

  // Fetch root folders
  const fetchRootFolders = useCallback(async (instance: PublicClientApplication | null = msalInstance, currentAccount: AccountInfo | null = account) => {
    if (!instance || !currentAccount) {
      setError("Not authenticated or MSAL not ready.");
      setIsLoading(false);
      return;
    }
    console.log("[SimplifiedOneDriveSetup] Fetching root folders...");
    setIsLoading(true);
    setError(null);

    const accessToken = await getAccessToken(instance, currentAccount);
    if (!accessToken) {
      setIsLoading(false);
      return; // Error handled within getAccessToken
    }

    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Graph API error fetching folders: ${response.statusText}`);
      }

      const data = await response.json();
      const oneDriveFolders: OneDriveFolder[] = (data.value || [])
        .filter((item: OneDriveItem) => item.folder)
        .map((item: OneDriveItem) => ({
          id: item.id,
          name: item.name,
          isFolder: true,
          path: item.parentReference?.path,
        }));

      console.log(`[SimplifiedOneDriveSetup] Found ${oneDriveFolders.length} root folders.`);
      setFolders(oneDriveFolders);
    } catch (err) {
      console.error("[SimplifiedOneDriveSetup] Error fetching folders:", err);
      setError(`Failed to fetch folders: ${err.message}`);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, [msalInstance, account, getAccessToken]);

  // Handle authentication button click
  const handleAuthenticate = useCallback(async () => {
    if (!msalInstance || isAuthInProgress) return;

    console.log("[SimplifiedOneDriveSetup] Initiating login...");
    setIsLoading(true);
    setIsAuthInProgress(true);
    setError(null);

    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      if (loginResponse && loginResponse.account) {
        console.log("[SimplifiedOneDriveSetup] Login successful.");
        setAccount(loginResponse.account);
        setIsAuthenticated(true);
        await fetchRootFolders(msalInstance, loginResponse.account); // Pass instance/account directly
      } else {
        // User might have closed popup
        console.log("[SimplifiedOneDriveSetup] Login popup closed or no account returned.");
        // Don't set error if user just closed it
      }
    } catch (err) {
      console.error("[SimplifiedOneDriveSetup] Login error:", err);
      // Avoid setting error if it's just interaction in progress
      if (!(err.name === "BrowserAuthError" && err.message.includes("interaction_in_progress"))) {
           setError(`Authentication failed: ${err.message}`);
           toast({ title: "Authentication Failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setIsAuthInProgress(false);
      // Don't set isLoading false here if fetchRootFolders was called
      if (!account) setIsLoading(false); 
    }
  }, [msalInstance, isAuthInProgress, fetchRootFolders, toast]);

  // Handle create folder button click
  const handleCreateFolder = useCallback(async () => {
    if (!msalInstance || !account || !newFolderName.trim()) return;

    console.log(`[SimplifiedOneDriveSetup] Creating root folder: ${newFolderName}`);
    setIsCreatingFolder(true);
    setError(null);

    const accessToken = await getAccessToken(msalInstance, account);
    if (!accessToken) {
      setIsCreatingFolder(false);
      return;
    }

    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newFolderName.trim(),
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Graph API error creating folder: ${response.statusText}`);
      }

      const newFolderData = await response.json();
      const createdFolder: OneDriveFolder = {
          id: newFolderData.id,
          name: newFolderData.name,
          isFolder: true,
          path: newFolderData.parentReference?.path
      };

      console.log("[SimplifiedOneDriveSetup] Folder created:", createdFolder);
      toast({ title: `Folder "${createdFolder.name}" created` });
      setNewFolderName('');
      await fetchRootFolders(); // Refresh list
      setSelectedFolder(createdFolder); // Auto-select

    } catch (err) {
      console.error("[SimplifiedOneDriveSetup] Error creating folder:", err);
      setError(`Failed to create folder: ${err.message}`);
      toast({ title: "Folder Creation Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsCreatingFolder(false);
    }
  }, [msalInstance, account, newFolderName, getAccessToken, fetchRootFolders, toast]);

  // Handle delete folder button click
  const handleDeleteFolder = useCallback(async (folderId: string, folderName: string) => {
    if (!msalInstance || !account)
        return;
    if (!window.confirm(`Are you sure you want to delete "${folderName}"?`))
        return;
    
    console.log(`[SimplifiedOneDriveSetup] Deleting folder: ${folderName} (ID: ${folderId})`);
    setIsDeletingFolderId(folderId);
    setError(null);

    const accessToken = await getAccessToken(msalInstance, account);
    if (!accessToken) {
        setIsDeletingFolderId(null);
        return;
    }

    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok && response.status !== 204) { // 204 No Content is success for DELETE
        throw new Error(`Graph API error deleting folder: ${response.statusText}`);
      }

      console.log(`[SimplifiedOneDriveSetup] Folder ${folderName} deleted.`);
      toast({ title: `Folder "${folderName}" deleted` });
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
      }
      await fetchRootFolders(); // Refresh list

    } catch (err) {
      console.error("[SimplifiedOneDriveSetup] Error deleting folder:", err);
      setError(`Failed to delete folder: ${err.message}`);
      toast({ title: "Folder Deletion Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsDeletingFolderId(null);
    }
  }, [msalInstance, account, selectedFolder, getAccessToken, fetchRootFolders, toast]);

  // Handle confirm selection button click
  const handleCompleteSelection = useCallback(() => {
    if (!selectedFolder) {
      toast({ title: "Please select a folder first", variant: "destructive" });
      return;
    }
    console.log("[SimplifiedOneDriveSetup] Confirming selection:", selectedFolder);
    onComplete({
      folderId: selectedFolder.id,
      folderName: selectedFolder.name,
      path: selectedFolder.path ? `${selectedFolder.path}/${selectedFolder.name}` : `/${selectedFolder.name}`, // Construct path
      isTemporary: false,
    });
  }, [selectedFolder, onComplete, toast]);

  // Handle use local storage button click
  const continueWithLocalStorage = useCallback(() => {
    const tempFolderId = `local-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    toast({
      title: "Using Local Storage",
      description: "Your data will be stored locally for this session.",
      duration: 3000
    });
    onComplete({
        path: "Local Storage",
        folderId: tempFolderId,
        folderName: "Local Storage",
        isTemporary: true
    });
  }, [onComplete, toast]);

  // --- Render Logic ---
  const effectiveIsLoading = isLoading || isAuthInProgress;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OneDrive Folder Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Section */}
          {!isAuthenticated && !effectiveIsLoading && (
            <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
              <p>Connect to your Microsoft account to select or create a OneDrive folder.</p>
              <Button onClick={handleAuthenticate} disabled={effectiveIsLoading}>
                {effectiveIsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect to OneDrive
              </Button>
            </div>
          )}

          {/* Loading Indicator */} 
          {effectiveIsLoading && (
             <div className="flex items-center justify-center space-x-2 text-muted-foreground">
               <Loader2 className="h-5 w-5 animate-spin" />
               <span>{isLoading && !account ? 'Initializing...' : isAuthInProgress ? 'Processing Authentication...' : 'Loading OneDrive data...'}</span>
             </div>
          )}

           {/* Error Display */} 
           {error && !effectiveIsLoading && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>OneDrive Error</AlertTitle>
               <AlertDescription>
                 {error}
                 <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => fetchRootFolders()} disabled={effectiveIsLoading}>
                       Retry
                    </Button>
                 </div>
               </AlertDescription>
             </Alert>
           )}

          {/* Folder Selection and Creation (if authenticated) */} 
          {isAuthenticated && !effectiveIsLoading && !error && (
            <div className="space-y-4">
              {/* Refresh Button */}
               <div className="flex justify-end">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchRootFolders()}
                      disabled={effectiveIsLoading}
                      title="Refresh folder list"
                  >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                  </Button>
               </div>

              {/* Folder List */} 
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {folders.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground text-center italic">No root folders found. You can create one below.</p>
                )}
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 ${selectedFolder?.id === folder.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <div className="flex items-center space-x-2">
                      <Folder className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      <span className="font-medium truncate" title={folder.name}>{folder.name}</span>
                    </div>
                    <Button
                       variant="ghost"
                       size="icon"
                       className="text-gray-500 hover:text-red-500"
                       onClick={(e) => {
                          e.stopPropagation(); // Prevent selection when clicking delete
                          handleDeleteFolder(folder.id, folder.name);
                       }}
                       disabled={isDeletingFolderId === folder.id}
                       title={`Delete folder "${folder.name}"`}
                    >
                       {isDeletingFolderId === folder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Create New Folder */} 
              <div>
                <label htmlFor="new-folder-name" className="block text-sm font-medium text-gray-700 mb-1">Create New Folder in Root</label>
                <div className="flex gap-2">
                  <Input
                    id="new-folder-name"
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter new folder name"
                    className="flex-grow"
                    disabled={isCreatingFolder}
                  />
                  <Button
                    onClick={handleCreateFolder}
                    disabled={effectiveIsLoading || isCreatingFolder || !newFolderName.trim()}
                    className="whitespace-nowrap"
                  >
                    {isCreatingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                    Create Folder
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */} 
      <div className="flex justify-end space-x-4">
         <Button
            variant="outline"
            onClick={continueWithLocalStorage}
            disabled={effectiveIsLoading}
         >
            Use Local Storage Instead
         </Button>
         {isAuthenticated && (
           <Button
             onClick={handleCompleteSelection}
             disabled={!selectedFolder || effectiveIsLoading}
             className="bg-blue-600 hover:bg-blue-700 text-white"
           >
             Confirm Selection
           </Button>
         )}
      </div>
    </div>
  );
};

export default SimplifiedOneDriveSetup;