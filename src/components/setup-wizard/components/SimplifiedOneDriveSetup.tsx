import React, { useState, useEffect, useCallback } from 'react';
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph'; // Import hook and Document type
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { OneDriveConfig, FolderItem } from '../types'; // Keep necessary types
import { Loader2, Folder, FolderPlus, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react'; // Icons
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Props definition remains the same
interface SimplifiedOneDriveSetupProps {
  onComplete: (config: OneDriveConfig) => void;
}

// Define FolderItem based on Document, ensuring isFolder is always true
type OneDriveFolder = Omit<Document, 'isFolder' | 'source' | 'parentReference' | 'size' | 'url' | 'lastModified'> & {
  isFolder: true;
  path?: string; // Keep path if potentially useful later
};

const SimplifiedOneDriveSetup: React.FC<SimplifiedOneDriveSetupProps> = ({ onComplete }) => {
  const {
    isLoading: isGraphLoading,
    lastError: graphError,
    getAuthStatus,
    handleLogin,
    getOneDriveDocuments, // Use this to fetch root items
    createFolder, // Use this to create root folders
    deleteFolder, // Use this to delete folders
  } = useMicrosoftGraph();

  const { toast } = useToast();

  // State for the component
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [folders, setFolders] = useState<OneDriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<OneDriveFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeletingFolderId, setIsDeletingFolderId] = useState<string | null>(null); // Track deletion target

  // Fetch root folders from OneDrive
  const fetchRootFolders = useCallback(async () => {
    console.log("[SimplifiedOneDriveSetup] Fetching root folders...");
    // Use getOneDriveDocuments which fetches root items by default
    const items = await getOneDriveDocuments();
    if (items) {
      // Filter for folders only
      const rootFolders = items
        .filter((item): item is Document & { isFolder: true } => !!item.isFolder)
        .map((folder) => ({ // Map to OneDriveFolder type
          id: folder.id,
          name: folder.name,
          isFolder: true,
          path: folder.parentReference?.path, // Preserve path if available
        }));
      console.log(`[SimplifiedOneDriveSetup] Found ${rootFolders.length} root folders.`);
      setFolders(rootFolders);
    } else {
      console.log("[SimplifiedOneDriveSetup] No items returned or error fetching folders.");
      setFolders([]); // Clear folders on error or no data
    }
  }, [getOneDriveDocuments]);

  // Check authentication status on component mount
  useEffect(() => {
    console.log("[SimplifiedOneDriveSetup] Checking authentication status...");
    setIsCheckingAuth(true);
    const status = getAuthStatus();
    console.log("[SimplifiedOneDriveSetup] Auth Status:", status);
    if (status.hasAccounts) {
      setIsAuthenticated(true);
      console.log("[SimplifiedOneDriveSetup] User is authenticated, fetching folders.");
      fetchRootFolders();
    } else {
      setIsAuthenticated(false);
      console.log("[SimplifiedOneDriveSetup] User is not authenticated.");
    }
    setIsCheckingAuth(false);
  }, [getAuthStatus, fetchRootFolders]);


  // Handle authentication action
  const handleAuthenticate = async () => {
    console.log("[SimplifiedOneDriveSetup] Initiating login...");
    const result = await handleLogin();
    if (result && result.account) {
      console.log("[SimplifiedOneDriveSetup] Login successful, fetching folders.");
      setIsAuthenticated(true);
      await fetchRootFolders(); // Fetch folders immediately after successful login
    } else {
      console.log("[SimplifiedOneDriveSetup] Login failed or cancelled.");
      toast({
        title: "Authentication Failed",
        description: "Could not connect to OneDrive. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({ title: "Folder name required", variant: "destructive" });
      return;
    }
    setIsCreatingFolder(true);
    console.log(`[SimplifiedOneDriveSetup] Creating root folder: ${newFolderName}`);
    // Pass undefined or null as parentFolderId to create in root
    const createdFolder = await createFolder(newFolderName.trim(), undefined);
    if (createdFolder) {
      console.log("[SimplifiedOneDriveSetup] Folder created:", createdFolder);
      toast({ title: `Folder "${createdFolder.name}" created` });
      setNewFolderName('');
      // Refresh the folder list to include the new folder
      await fetchRootFolders();
      // Automatically select the newly created folder
      const newlyCreatedFolderData = folders.find(f => f.id === createdFolder.id) || { ...createdFolder, isFolder: true };
      setSelectedFolder(newlyCreatedFolderData);
    } else {
      console.error("[SimplifiedOneDriveSetup] Failed to create folder.");
      // Error toast is likely handled within useMicrosoftGraph, but we can add one here if needed
      toast({ title: "Folder Creation Failed", description: graphError || "Could not create folder.", variant: "destructive" });
    }
    setIsCreatingFolder(false);
  };

  // Handle folder deletion
  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    // Basic confirmation
    if (!window.confirm(`Are you sure you want to delete the folder "${folderName}"? This cannot be undone.`)) {
      return;
    }
    setIsDeletingFolderId(folderId);
    console.log(`[SimplifiedOneDriveSetup] Deleting folder: ${folderName} (ID: ${folderId})`);
    const success = await deleteFolder(folderId);
    if (success) {
      console.log(`[SimplifiedOneDriveSetup] Folder ${folderName} deleted.`);
      toast({ title: `Folder "${folderName}" deleted` });
      // If the deleted folder was selected, clear the selection
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
      }
      // Refresh the folder list
      await fetchRootFolders();
    } else {
      console.error(`[SimplifiedOneDriveSetup] Failed to delete folder ${folderName}.`);
      // Error toast is likely handled within useMicrosoftGraph
      toast({ title: "Folder Deletion Failed", description: graphError || `Could not delete folder ${folderName}.`, variant: "destructive" });
    }
    setIsDeletingFolderId(null);
  };

  // Handle completing the selection
  const handleCompleteSelection = () => {
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
  };

   // Function to handle 'Use Local Storage' button click
  const continueWithLocalStorage = () => {
    try {
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
    } catch (error) {
      console.error("Error setting up local storage:", error);
      toast({
        title: "Error",
        description: "There was a problem setting up local storage.",
        variant: "destructive"
      });
    }
  };

  // Loading state combines graph loading and auth checking
  const isLoading = isGraphLoading || isCheckingAuth;
  const currentError = graphError; // Use error from the hook

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OneDrive Folder Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Section */}
          {!isAuthenticated && !isLoading && (
            <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
              <p>Connect to your Microsoft account to select or create a OneDrive folder.</p>
              <Button onClick={handleAuthenticate} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect to OneDrive
              </Button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
             <div className="flex items-center justify-center space-x-2 text-muted-foreground">
               <Loader2 className="h-5 w-5 animate-spin" />
               <span>{isCheckingAuth ? 'Checking authentication...' : 'Loading OneDrive data...'}</span>
             </div>
          )}

           {/* Error Display */}
           {currentError && !isLoading && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>OneDrive Error</AlertTitle>
               <AlertDescription>
                 {currentError}
                 <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={fetchRootFolders} disabled={isLoading}>
                       Retry Fetch
                    </Button>
                 </div>
               </AlertDescription>
             </Alert>
           )}

          {/* Folder Selection and Creation (if authenticated) */}
          {isAuthenticated && !isLoading && !currentError && (
            <div className="space-y-4">
              {/* Refresh Button */}
               <div className="flex justify-end">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchRootFolders}
                      disabled={isLoading}
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
                    disabled={isLoading || isCreatingFolder || !newFolderName.trim()}
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
         {/* Always show local storage option if OneDrive fails or as an alternative */}
         <Button
            variant="outline"
            onClick={continueWithLocalStorage}
            disabled={isLoading}
         >
            Use Local Storage Instead
         </Button>
         {/* Confirm button only enabled when authenticated and a folder is selected */}
         {isAuthenticated && (
           <Button
             onClick={handleCompleteSelection}
             disabled={!selectedFolder || isLoading}
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