import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMsal } from '@azure/msal-react';
import { useMicrosoftGraph } from '@/hooks/useMicrosoftGraph';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FolderItem, OneDriveConfig } from '../types';
import OneDriveAuth from './OneDriveAuth';
import FolderListView from './FolderListView';
import CreateFolder from './CreateFolder';
import DeleteFolderModal from './DeleteFolderModal';
import ErrorBoundary from './ErrorBoundary';
import OneDriveErrorCard from './OneDriveErrorCard';

// Add window interface extension for our global variables
declare global {
  interface Window {
    oneDriveFetchAttempts?: number;
    oneDriveToastShown?: boolean;
  }
}

interface SimplifiedOneDriveSetupProps {
  onComplete: (config: OneDriveConfig) => void;
}

const SimplifiedOneDriveSetup: React.FC<SimplifiedOneDriveSetupProps> = ({ onComplete }) => {
  const { isAuthenticated, loginWithMicrosoft } = useAuth();
  const { instance } = useMsal();
  const { toast } = useToast();
  const { createFolder } = useMicrosoftGraph();
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([]);
  
  // Add refs to track state
  const initialFoldersLoaded = useRef(false);
  const lastFolderRequest = useRef<string | null>(null);
  
  // Auth scopes for Microsoft Graph
  const graphScopes = {
    scopes: ["Files.ReadWrite", "Sites.ReadWrite.All", "User.Read"]
  };
  
  // Handle Microsoft authentication
  const handleAuthenticate = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      setFolderError(null);
      
      console.log("Starting Microsoft authentication process");
      await loginWithMicrosoft();
      
      // Check if authentication was successful by polling for user status
      let authCheckAttempts = 0;
      const maxAuthCheckAttempts = 10;
      
      const checkAuthStatus = () => {
        return new Promise<boolean>((resolve) => {
          const checkInterval = setInterval(() => {
            authCheckAttempts++;
            console.log(`Checking auth status (attempt ${authCheckAttempts}/${maxAuthCheckAttempts})...`);
            
            if (isAuthenticated) {
              console.log("Authentication successful!");
              clearInterval(checkInterval);
              resolve(true);
            } else if (authCheckAttempts >= maxAuthCheckAttempts) {
              console.log("Authentication check timed out");
              clearInterval(checkInterval);
              resolve(false);
            }
          }, 1000);
        });
      };
      
      toast({ 
        title: "Microsoft Authentication",
        description: "Login initiated. You'll be redirected to Microsoft to sign in.",
        duration: 5000
      });
      
      // Wait for auth to complete
      const authSuccessful = await checkAuthStatus();
      
      if (!authSuccessful) {
        console.warn("Authentication process may not have completed properly");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(error?.message || "Failed to start authentication");
      toast({
        title: "Authentication Failed",
        description: "Unable to connect to Microsoft. Try again or use local storage.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      // Give time for redirects
      setTimeout(() => {
        setIsAuthenticating(false);
        // Try fetching folders again if authenticated
        if (isAuthenticated) {
          console.log("Authentication complete, fetching folders");
          fetchOneDriveFolders();
        }
      }, 2000);
    }
  };
  
  // Fetch OneDrive folders directly using Microsoft Graph API
  const fetchOneDriveFolders = async (folderId?: string) => {
    console.log("fetchOneDriveFolders called with folderId:", folderId);
    
    // If this is an automatic call (no folderId) and we have a lastFolderRequest, 
    // use that to prevent unwanted resets to root
    if (!folderId && lastFolderRequest.current && initialFoldersLoaded.current) {
      console.log("Automatic call redirected to last requested folder:", lastFolderRequest.current);
      folderId = lastFolderRequest.current;
    }
    
    // Add a static counter to prevent infinite retries across component re-renders
    if (!window.oneDriveFetchAttempts) {
      window.oneDriveFetchAttempts = 0;
    }
    
    // Check if this is a new folder request or a refresh
    const isNewFolderRequest = folderId !== currentFolderId;
    
    // If just refreshing the current folder view, don't increment the counter
    if (isNewFolderRequest) {
      window.oneDriveFetchAttempts++;
      console.log(`OneDrive fetch attempt #${window.oneDriveFetchAttempts}`);
    } else {
      console.log("Refreshing current folder view, not counting as a new attempt");
    }
    
    // If we've already tried too many times, just show the local storage option
    if (window.oneDriveFetchAttempts > 5) {
      console.log("Too many OneDrive fetch attempts, suggesting local storage instead");
      setFolderError("Multiple OneDrive connection attempts failed. Please use local storage or try again later.");
      setFolders([]);
      return;
    }
    
    try {
      setIsLoading(true);
      setFolderError(null);
      
      // Check authentication status first
      if (!isAuthenticated || !instance) {
        console.log("User not authenticated, attempting authentication first");
        await handleAuthenticate();
        // After authentication completes, we'll continue with the fetch below
        if (!isAuthenticated) {
          throw new Error("Authentication required to access OneDrive");
        }
      }
      
      // Get current active account
      const accounts = instance.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No Microsoft account found. Please sign in again.");
      }
      
      try {
        // Get access token for Microsoft Graph
        const tokenResponse = await instance.acquireTokenSilent({
          ...graphScopes,
          account: accounts[0]
        });
        
        let endpoint;
        if (folderId) {
          // Get contents of a specific folder
          console.log(`Fetching contents of folder: ${folderId}`);
          endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$filter=folder ne null`;
          
          // If this is a new folder navigation (not a refresh of current), update the path
          if (folderId !== currentFolderId) {
            // Find the folder in the list to get its name
            const folder = folders.find(f => f.id === folderId);
            if (folder) {
              console.log("Updating folder path with:", folder.name);
              // Add this folder to the path
              setFolderPath(prev => [...prev, { id: folderId, name: folder.name }]);
            } else {
              console.log("Folder not found in current list, might be navigating directly");
            }
            
            // Remember this as our current folder ID
            lastFolderRequest.current = folderId;
          }
          
          // Update current folder ID
          setCurrentFolderId(folderId);
        } else {
          // Get root folders
          console.log("Fetching root folders from OneDrive");
          endpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null';
          
          // Reset path when navigating to root
          setFolderPath([]);
          setCurrentFolderId(null);
          lastFolderRequest.current = null;
        }
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Graph API error response:", errorData);
          throw new Error(`Failed to fetch folders: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Folder response data:", data);
        
        if (data && data.value && Array.isArray(data.value)) {
          const folderItems = data.value;
          console.log(`Retrieved ${folderItems.length} items`);
          
          // Map to a consistent format
          const formattedFolders = folderItems.map(item => ({
            id: item.id,
            name: item.name,
            isFolder: !!item.folder,
            path: item.parentReference?.path,
            webUrl: item.webUrl
          }));
          
          // Filter to only include folders
          const onlyFolders = formattedFolders.filter(item => item.isFolder);
          console.log(`Found ${onlyFolders.length} folders`);
          
          setFolders(onlyFolders);
          setFolderError(null);
          
          // We successfully loaded folders, mark the initialFoldersLoaded flag
          initialFoldersLoaded.current = true;
          
          // Reset retry counter on success
          if (isNewFolderRequest) {
            window.oneDriveFetchAttempts = 0;
          }
        } else {
          console.error("Invalid response format from Graph API:", data);
          throw new Error("Invalid response format from OneDrive API");
        }
      } catch (tokenError) {
        console.error("Token acquisition or API error:", tokenError);
        throw tokenError;
      }
    } catch (error) {
      console.error("Error fetching OneDrive folders:", error);
      setFolderError(`Error: ${error?.message || 'Unknown error'}`);
      
      // After multiple failures, suggest local storage
      if (window.oneDriveFetchAttempts > 3) {
        toast({
          title: "OneDrive Connection Problems",
          description: "Having trouble connecting to OneDrive. Consider using local storage instead.",
          variant: "destructive",
          duration: 7000
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add retry functionality
  const handleRetryFolderFetch = async () => {
    // Clear any existing error
    setFolderError(null);
    
    // If we're already authenticated, try fetching folders again
    if (isAuthenticated) {
      toast({
        title: "Retrying",
        description: "Attempting to fetch your OneDrive folders again...",
        duration: 3000
      });
      
      // Add a small delay before retrying
      setTimeout(() => {
        fetchOneDriveFolders(currentFolderId || undefined);
      }, 500);
    } else {
      // Try authenticating again
      handleAuthenticate();
    }
  };
  
  // Navigate to a folder
  const navigateToFolder = (folder: FolderItem) => {
    console.log("Navigating to folder:", folder.name, folder.id);
    // Store the folder ID we're requesting in the ref
    lastFolderRequest.current = folder.id;
    // This should be a manual fetch, not affected by the automatic fetch conditions
    fetchOneDriveFolders(folder.id);
  };
  
  // Navigate up one level
  const navigateUp = () => {
    if (folderPath.length === 0) {
      // Already at root, nothing to do
      console.log("Already at root, can't navigate up");
      return;
    }
    
    console.log("Navigating up from current path:", folderPath);
    
    // Remove the last item from the path
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    
    // Navigate to parent folder or root
    if (newPath.length > 0) {
      const parentFolder = newPath[newPath.length - 1];
      console.log("Navigating to parent folder:", parentFolder.name, parentFolder.id);
      lastFolderRequest.current = parentFolder.id;
      fetchOneDriveFolders(parentFolder.id);
    } else {
      // Back to root
      console.log("Navigating to root folder");
      lastFolderRequest.current = null;
      fetchOneDriveFolders();
    }
  };
  
  // Navigate to a specific point in the path
  const navigateToPathItem = (index: number) => {
    if (index < 0 || index >= folderPath.length) {
      console.log("Invalid path index:", index);
      return;
    }
    
    // If clicking on the last item in path (current folder), do nothing
    if (index === folderPath.length - 1) {
      console.log("Already at this folder, ignoring click");
      return;
    }
    
    console.log(`Navigating to path item at index ${index}:`, folderPath[index]);
    
    // Create a new path up to the clicked index
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    
    // Navigate to the folder at that index
    const folderId = newPath[index].id;
    lastFolderRequest.current = folderId;
    fetchOneDriveFolders(folderId);
  };
  
  // Handle continuing with local storage
  const continueWithLocalStorage = () => {
    try {
      // Create a temporary folder ID
      const tempFolderId = `local-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      toast({
        title: "Using Local Storage",
        description: "Your data will be stored locally for this session.",
        duration: 3000
      });
      
      // Complete with local storage config
      onComplete({
        path: "Local Storage",
        folderId: tempFolderId,
        folderName: "Local Storage",
        isTemporary: true
      });
    } catch (error) {
      console.error("Error setting up local storage:", error);
      toast({
        title: "Error",
        description: "There was a problem setting up local storage.",
        variant: "destructive"
      });
    }
  };
  
  // Create a folder in the current location using direct Graph API
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Folder Name Required",
        description: "Please enter a name for your new folder.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setFolderError(null);
      
      if (!isAuthenticated || !instance) {
        throw new Error("Authentication required to create folders");
      }
      
      // Get current active account
      const accounts = instance.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No Microsoft account found. Please sign in again.");
      }
      
      // Get access token for Microsoft Graph
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ["Files.ReadWrite", "Sites.ReadWrite.All"],
        account: accounts[0]
      });
      
      // Determine endpoint based on whether we're in a specific folder or root
      let endpoint;
      if (currentFolderId) {
        // Create folder in a specific parent folder
        endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${currentFolderId}/children`;
      } else {
        // Create folder in root
        endpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
      }
      
      // Set up the request body to create a folder
      const folderData = {
        name: newFolderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename"
      };
      
      // Send the request to create the folder
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(folderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Folder creation API error:", errorData);
        throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response to get the created folder
      const newFolder = await response.json();
      
      if (newFolder && newFolder.id) {
        // Format the folder to match our expected structure
        const formattedFolder = {
          id: newFolder.id,
          name: newFolder.name,
          isFolder: true,
          path: newFolder.parentReference?.path,
          webUrl: newFolder.webUrl
        };
        
        // Add the new folder to the list
        setFolders(prev => [...prev, formattedFolder]);
        setNewFolderName("");
        
        toast({
          title: "Folder Created",
          description: `Created folder: ${formattedFolder.name}`,
          duration: 3000
        });
        
        // Auto-select the new folder
        setSelectedFolder(formattedFolder);
        
        // Automatically continue with the newly created folder
        const folderConfig = {
          path: formattedFolder.name,
          folderId: formattedFolder.id,
          isNewFolder: true,
          folderName: formattedFolder.name,
          isTemporary: false
        };
        
        console.log('Created folder, calling onComplete with config:', folderConfig);
        
        // Add a tiny delay to ensure UI update before continuing
        setTimeout(() => {
          onComplete(folderConfig);
        }, 200);
        
        // Create a reference to scroll to the new folder into view
        setTimeout(() => {
          const folderElement = document.getElementById(`folder-${newFolder.id}`);
          if (folderElement) {
            folderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a highlight effect
            folderElement.classList.add('highlight-folder');
            setTimeout(() => {
              folderElement.classList.remove('highlight-folder');
            }, 2000);
          }
        }, 150);
      } else {
        throw new Error("Invalid response format from folder creation");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      setFolderError(`Error creating folder: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to create folder: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a folder in OneDrive using direct Graph API
  const handleDeleteFolder = async (folder: FolderItem) => {
    setDeletingFolder(folder);
    setConfirmDelete(true);
  };
  
  const confirmDeleteFolder = async () => {
    if (!deletingFolder) return;
    
    try {
      setIsLoading(true);
      setFolderError(null);
      
      if (!isAuthenticated || !instance) {
        throw new Error("Authentication required to delete folders");
      }
      
      // Get current active account
      const accounts = instance.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No Microsoft account found. Please sign in again.");
      }
      
      // Get access token for Microsoft Graph
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ["Files.ReadWrite", "Sites.ReadWrite.All"],
        account: accounts[0]
      });
      
      // Delete the folder by ID
      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${deletingFolder.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`
        }
      });
      
      if (!response.ok && response.status !== 204) { // 204 No Content is success for DELETE
        const errorData = await response.json().catch(() => ({}));
        console.error("Folder deletion API error:", errorData);
        throw new Error(`Failed to delete folder: ${response.status} ${response.statusText}`);
      }
      
      // Remove the folder from the list
      setFolders(prev => prev.filter(f => f.id !== deletingFolder.id));
      
      // Reset selection if the deleted folder was selected
      if (selectedFolder && selectedFolder.id === deletingFolder.id) {
        setSelectedFolder(null);
      }
      
      toast({
        title: "Folder Deleted",
        description: `Deleted folder: ${deletingFolder.name}`,
        duration: 3000
      });
    } catch (error) {
      console.error("Error deleting folder:", error);
      setFolderError(`Error deleting folder: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to delete folder: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setDeletingFolder(null);
      setConfirmDelete(false);
    }
  };
  
  // Select a folder and complete the setup
  const handleSelectFolder = (folder: FolderItem) => {
    console.log('Folder selected:', folder);
    setSelectedFolder(folder);
    setIsLoading(true); // Set loading state to show user that processing is happening
    
    // Show a success toast to indicate folder selection
    toast({
      title: "Folder Selected",
      description: `Selected folder: ${folder.name}`,
      duration: 2000
    });
    
    // Automatically continue with the selected folder
    const folderConfig = {
      path: folder.name,
      folderId: folder.id,
      isTemporary: false,
      folderName: folder.name
    };
    console.log('Calling onComplete with folder config:', folderConfig);
    
    // Add a tiny delay to ensure UI update before continuing
    setTimeout(() => {
      onComplete(folderConfig);
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">OneDrive Integration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect to OneDrive or use local storage for your unit data
        </p>
      </div>
      
      {!isAuthenticated ? (
        /* Authentication Card */
        <OneDriveAuth 
          handleAuthenticate={handleAuthenticate}
          isAuthenticating={isAuthenticating}
          authError={authError}
        />
      ) : (
        /* OneDrive Folders Section */
        <>
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm mb-4">
            <p>✅ Successfully authenticated with Microsoft!</p>
            <p className="mt-1">Select an existing folder or create a new one for your unit data.</p>
          </div>
          
          {folderError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm mb-4 flex items-center justify-between">
              <p>{folderError}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetryFolderFetch}
                className="ml-2 whitespace-nowrap"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
          
          {/* Folder List */}
          {folderError ? (
            <OneDriveErrorCard
              folderError={folderError}
              onRetry={handleRetryFolderFetch}
              onCreateFolder={handleCreateFolder}
              onLocalStorage={continueWithLocalStorage}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              isLoading={isLoading}
            />
          ) : (
            <ErrorBoundary>
              <FolderListView
                folders={folders}
                currentFolderId={currentFolderId}
                folderPath={folderPath}
                isLoading={isLoading}
                selectedFolder={selectedFolder}
                folderError={folderError}
                handleRetryFolderFetch={handleRetryFolderFetch}
                handleSelectFolder={handleSelectFolder}
                navigateToFolder={navigateToFolder}
                handleDeleteFolder={handleDeleteFolder}
                fetchOneDriveFolders={fetchOneDriveFolders}
                navigateUp={navigateUp}
                navigateToPathItem={navigateToPathItem}
              />
            </ErrorBoundary>
          )}
          
          {/* Create New Folder - only show when no error or we have folders */}
          {!folderError && (
            <CreateFolder
              onCreateFolder={handleCreateFolder}
              isLoading={isLoading}
              currentPath={folderPath.length > 0 ? folderPath[folderPath.length - 1].name : 'Root'}
            />
          )}
        </>
      )}
      
      {/* Local Storage Option */}
      <div className="pt-4 border-t mt-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Or continue without connecting to OneDrive
        </p>
        <Button
          variant="outline"
          onClick={continueWithLocalStorage}
          className="w-full"
        >
          Continue with Local Storage
        </Button>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteFolderModal
        folder={deletingFolder}
        isLoading={isLoading}
        onCancel={() => {
          setConfirmDelete(false);
          setDeletingFolder(null);
        }}
        onConfirm={confirmDeleteFolder}
      />
    </div>
  );
};

export default SimplifiedOneDriveSetup; 