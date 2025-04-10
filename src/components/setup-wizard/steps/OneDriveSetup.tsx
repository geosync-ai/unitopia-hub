import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Cloud, FolderPlus, FolderOpen, ChevronLeft, ChevronRight, Folder, Edit2, Loader2, AlertCircle, ChevronDown, RefreshCw, Plus, Edit, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface OneDriveSetupProps {
  onComplete: (config: any) => void;
}

export const OneDriveSetup: React.FC<OneDriveSetupProps> = ({ onComplete }) => {
  const { toast: useToastToast } = useToast();
  const { isAuthenticated, loginWithMicrosoft, msGraphConfig } = useAuth();
  const { 
    getOneDriveDocuments, 
    getFolderContents, 
    createFolder, 
    renameFolder, 
    deleteFolder,
    lastError,
    getAuthStatus
  } = useMicrosoftGraph();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Document | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Document | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [folderToDelete, setFolderToDelete] = useState<Document | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);
  const [skipOneDriveAuth, setSkipOneDriveAuth] = useState(false);

  const updateAuthStatus = useCallback(() => {
    const status = getAuthStatus();
    setAuthStatus(status);
    return status;
  }, [getAuthStatus]);
  
  // Define handleAuthenticate first to avoid circular dependency
  const handleAuthenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    setConnectionRetryCount(prev => prev + 1);
    try {
      console.log('Starting Microsoft authentication...');
      await loginWithMicrosoft();
      console.log('Authentication initiated successfully via redirect');
      
      // Force re-check auth status
      const status = updateAuthStatus();
      console.log('Post-authentication status:', status);
      
      // Add a small delay to ensure the auth token is processed
      setTimeout(async () => {
        if (status.hasAccounts) {
          try {
            setIsLoading(true);
            const oneDriveDocs = await getOneDriveDocuments();
            if (oneDriveDocs) {
              console.log('Post-auth document fetch successful:', oneDriveDocs);
              setDocuments(oneDriveDocs);
            }
          } catch (fetchError) {
            console.error('Post-auth document fetch failed:', fetchError);
          } finally {
            setIsLoading(false);
          }
        }
      }, 1000);
    } catch (error) {
      console.error('Authentication initiation error:', error);
      const errorMsg = error.message || 'Unknown auth error';
      setAuthError(`Authentication failed: ${errorMsg}`);
      toast.error('Failed to connect to OneDrive. Please try again.');
    } finally {
      setIsAuthenticating(false); 
    }
  }, [loginWithMicrosoft, updateAuthStatus, getOneDriveDocuments]);

  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('fetchDocuments: Not authenticated, returning.');
      setAuthError('Not authenticated. Please sign in with Microsoft first.');
      return;
    }
    
    console.log('fetchDocuments: Fetching...');
    setIsLoading(true); 
    setAuthError(null);
    
    try {
      const oneDriveDocs = await getOneDriveDocuments();
      if (oneDriveDocs) {
        console.log('fetchDocuments: Successfully fetched documents.', oneDriveDocs);
        setDocuments(oneDriveDocs);
        // Reset retry count on success
        setRetryCount(0);
      } else {
        console.log('fetchDocuments: getOneDriveDocuments returned null (likely an error occurred).');
        setAuthError("Couldn't retrieve OneDrive files. Please try to authenticate again.");
        
        // If we're getting null results but are supposedly authenticated,
        // we might need to try logging in again
        if (retryCount < 2) {
          console.log(`Retry attempt ${retryCount + 1}/2`);
          setRetryCount(prev => prev + 1);
          await handleAuthenticate();
        }
      }
    } catch (error) {
      console.error('fetchDocuments: Error caught:', error);
      setAuthError(`Failed to fetch documents: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getOneDriveDocuments, retryCount, handleAuthenticate]);

  useEffect(() => {
    const status = updateAuthStatus();
    console.log('Auth status updated:', status);
    
    // If we're authenticated but have no documents, fetch them
    if (isAuthenticated && documents.length === 0 && !isLoading) {
      console.log('useEffect: Authenticated and no documents, fetching...');
      fetchDocuments();
    } else if (isAuthenticated) {
      console.log('useEffect: Authenticated but documents already loaded or loading, skipping fetch.');
    } else {
      console.log('useEffect: Not authenticated, clearing documents.');
      setDocuments([]);
      setSelectedFolder(null);
      setCurrentPath([]);
    }
  }, [isAuthenticated, documents.length, fetchDocuments, updateAuthStatus, isLoading]);

  const handleFolderClick = useCallback(async (folder: Document) => {
    if (!folder.isFolder) return;
    
    setIsLoading(true);
    try {
      console.log(`Navigating to folder: ${folder.name} (${folder.id})`);
      const folderContents = await getFolderContents(folder.id, 'OneDrive');
      console.log('Folder contents:', folderContents);
      if (folderContents) {
        setDocuments(folderContents);
        setCurrentPath([...currentPath, { id: folder.id, name: folder.name }]);
        setSelectedFolder(folder);
      }
    } catch (error) {
      console.error('Error navigating to folder:', error);
      toast.error('Failed to navigate to folder');
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, getFolderContents]);

  const handleNavigateUp = async () => {
    if (currentPath.length === 0) {
      await fetchDocuments();
      setCurrentPath([]);
      setSelectedFolder(null);
      return;
    }

    const newPath = [...currentPath];
    newPath.pop();
    setCurrentPath(newPath);

    if (newPath.length === 0) {
      await fetchDocuments();
      setSelectedFolder(null);
    } else {
      const parentFolder = newPath[newPath.length - 1];
      setIsLoading(true);
      try {
        const folderContents = await getFolderContents(parentFolder.id, 'OneDrive');
        if (folderContents) {
          setDocuments(folderContents);
          setSelectedFolder({
            id: parentFolder.id,
            name: parentFolder.name,
            url: '',
            lastModified: new Date().toISOString(),
            size: 0,
            isFolder: true,
            source: 'OneDrive'
          });
        }
      } catch (error) {
        console.error('Error navigating up:', error);
        toast.error('Failed to navigate up');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      setIsLoading(true);
      const parentId = selectedFolder?.id;
      const newFolder = await createFolder(newFolderName, parentId);
      if (newFolder) {
        toast.success('Folder created successfully');
        setNewFolderName('');
        setIsCreatingFolder(false);
        if (selectedFolder) {
          const contents = await getFolderContents(selectedFolder.id, 'OneDrive');
          if (contents) {
            setDocuments(contents);
          }
        } else {
          await fetchDocuments();
        }
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameFolder = async () => {
    if (!newFolderName.trim() || !folderToRename) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      setIsLoading(true);
      const renamedFolder = await renameFolder(folderToRename.id, newFolderName);
      if (renamedFolder) {
        toast.success('Folder renamed successfully');
        setNewFolderName('');
        setIsRenamingFolder(false);
        setFolderToRename(null);
        if (selectedFolder) {
          const contents = await getFolderContents(selectedFolder.id, 'OneDrive');
          if (contents) {
            setDocuments(contents);
          }
        } else {
          await fetchDocuments();
        }
      }
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast.error('Failed to rename folder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async (folder: Document) => {
    setFolderToDelete(folder);
    setIsDeletingFolder(true);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) {
      toast.error('No folder selected for deletion');
      return;
    }

    try {
      setIsLoading(true);
      const success = await deleteFolder(folderToDelete.id);
      if (success) {
        toast.success('Folder deleted successfully');
        setIsDeletingFolder(false);
        setFolderToDelete(null);
        if (selectedFolder) {
          const contents = await getFolderContents(selectedFolder.id, 'OneDrive');
          if (contents) {
            setDocuments(contents);
          }
        } else {
          await fetchDocuments();
        }
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePathSelect = async () => {
    console.log('Continue button clicked');
    console.log('Current state:', {
      selectedFolder,
      isCreatingFolder,
      newFolderName,
      currentPath
    });

    if (isCreatingFolder && newFolderName) {
      console.log('Creating new folder:', newFolderName);
      try {
        setIsLoading(true);
        const parentId = selectedFolder?.id;
        console.log('Creating folder with parent ID:', parentId);
        
        const newFolder = await createFolder(newFolderName, parentId);
        console.log('New folder created:', newFolder);
        
        if (newFolder) {
          console.log('Calling onComplete with new folder');
          toast.success('Folder created successfully!', {
            description: `Created "${newFolderName}" in OneDrive`,
            duration: 2000,
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          onComplete({
            path: newFolderName,
            folderId: newFolder.id,
            isNewFolder: true,
            folderName: newFolderName,
          });
          console.log('Successfully completed with new folder');
        } else {
          console.error('createFolder returned null or undefined');
          toast.error('Failed to create folder - no folder ID returned');
        }
      } catch (error) {
        console.error('Error creating folder:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        toast.error('Failed to create folder');
      } finally {
        setIsLoading(false);
      }
    } else if (selectedFolder) {
      console.log('Using existing folder:', selectedFolder);
      try {
        onComplete({
          path: selectedFolder.name,
          folderId: selectedFolder.id,
          isNewFolder: false,
        });
        console.log('Successfully completed with existing folder');
      } catch (error) {
        console.error('Error in onComplete with existing folder:', error);
        toast.error('Failed to proceed with selected folder');
      }
    } else {
      console.warn('Invalid state for folder selection:', {
        selectedFolder,
        isCreatingFolder,
        newFolderName
      });
      toast.error('Please select or create a folder before continuing');
    }
  };

  const handleSkipOneDriveAuth = useCallback(() => {
    setSkipOneDriveAuth(true);
    // Create a temporary folder ID to use
    const tempFolderId = `temp-${Date.now()}`;
    // Complete the step with a temporary folder
    onComplete({
      path: "Temporary Folder",
      folderId: tempFolderId,
      isNewFolder: true,
      isTemporary: true
    });
    toast.warning('Proceeding with temporary setup. Some features may be limited.');
  }, [onComplete]);

  const renderDiagnostics = () => {
    const redirectUriWarning = msGraphConfig?.redirectUri !== "https://unitopia-hub.vercel.app/" 
      ? "Warning: Redirect URI doesn't match the one configured in Azure portal (should be https://unitopia-hub.vercel.app/)"
      : null;

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
    const isOriginMismatch = currentOrigin !== "https://unitopia-hub.vercel.app";
    
    return (
      <Collapsible 
        className="mt-4 border border-gray-200 rounded-md p-2"
        open={showDiagnostics}
        onOpenChange={setShowDiagnostics}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="flex w-full justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              Authentication Diagnostics
            </div>
            <span>{showDiagnostics ? '▲' : '▼'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 text-xs font-mono bg-gray-50 p-2 rounded overflow-auto max-h-[200px]">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1">
              <span className="font-semibold">Is Authenticated:</span>
              <span>{isAuthenticated ? 'Yes' : 'No'}</span>
              
              <span className="font-semibold">MSAL Initialized:</span>
              <span>{authStatus?.isInitialized ? 'Yes' : 'No'}</span>
              
              <span className="font-semibold">Has Accounts:</span>
              <span>{authStatus?.hasAccounts ? `Yes (${authStatus?.accountCount})` : 'No'}</span>
              
              <span className="font-semibold">Active Account:</span>
              <span>{authStatus?.activeAccount ? authStatus.activeAccount.username : 'None'}</span>
              
              <span className="font-semibold">Configured Redirect URI:</span>
              <span>{msGraphConfig?.redirectUri || 'Not set'}</span>
              
              <span className="font-semibold">Current Origin:</span>
              <span className={isOriginMismatch ? "text-amber-600 font-bold" : ""}>{currentOrigin}</span>
              
              <span className="font-semibold">Last Error:</span>
              <span className="text-red-500">{lastError || 'None'}</span>
            </div>
            
            {(redirectUriWarning || isOriginMismatch) && (
              <div className="bg-amber-50 border border-amber-200 p-2 rounded text-amber-800">
                {redirectUriWarning && <p>⚠️ {redirectUriWarning}</p>}
                {isOriginMismatch && (
                  <p>⚠️ Current origin ({currentOrigin}) doesn't match the configured redirect URI. 
                  This might cause authentication issues.</p>
                )}
                <p className="mt-1">
                  The redirect URI in Azure portal must match exactly: https://unitopia-hub.vercel.app/
                </p>
              </div>
            )}
            
            <div>
              <span className="font-semibold">Full Auth Status:</span>
              <pre className="mt-1 text-xs overflow-auto max-h-[100px] bg-gray-100 p-1 rounded">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            </div>
            
            <Button size="sm" variant="outline" onClick={updateAuthStatus} className="w-full mt-2">
              Refresh Status
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderConnectionIssue = () => {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
        <h4 className="font-medium text-amber-700 mb-2">Connection Issues Detected</h4>
        <p className="text-sm text-amber-600 mb-3">
          We're having trouble connecting to OneDrive. This could be due to:
        </p>
        <ul className="list-disc list-inside text-sm text-amber-600 mb-3 pl-2">
          <li>Network connectivity issues</li>
          <li>Microsoft authentication service disruption</li>
          <li>Browser security settings blocking the authentication</li>
        </ul>
        <div className="flex flex-col space-y-2 mt-4">
          <Button 
            variant="outline" 
            onClick={handleAuthenticate} 
            disabled={isAuthenticating}
            className="w-full"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>Retry Connection</>
            )}
          </Button>
          {connectionRetryCount >= 1 && (
            <Button
              variant="ghost"
              onClick={handleSkipOneDriveAuth}
              className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              Continue Without OneDrive
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Connect to OneDrive</h3>
        <p className="text-sm text-muted-foreground">
          Choose where to store your unit's data
        </p>
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{authError}</span>
        </div>
      )}

      {!isAuthenticated ? (
        <>
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Cloud className="h-16 w-16 text-blue-500" />
              <h3 className="text-lg font-semibold">Connect to Microsoft OneDrive</h3>
              <p className="text-center text-sm text-muted-foreground max-w-md">
                Connect to your Microsoft account to access OneDrive and select where to store your unit data.
              </p>
              <Button 
                onClick={handleAuthenticate} 
                className="mt-4"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>Connect to OneDrive</>
                )}
              </Button>
            </div>
          </Card>
          {connectionRetryCount > 0 && renderConnectionIssue()}
          {renderDiagnostics()}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateUp}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentPath([]);
                  fetchDocuments();
                  setSelectedFolder(null);
                }}
                disabled={isLoading}
              >
                OneDrive Root
              </Button>
              {currentPath.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPath = currentPath.slice(0, index + 1);
                      setCurrentPath(newPath);
                      const folder = {
                        id: item.id,
                        name: item.name,
                        url: '',
                        lastModified: new Date().toISOString(),
                        size: 0,
                        isFolder: true,
                        source: 'OneDrive' as const
                      };
                      handleFolderClick(folder);
                    }}
                    disabled={isLoading || index === currentPath.length - 1}
                  >
                    {item.name}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-4 min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Loading files from OneDrive...</p>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we retrieve your OneDrive folders</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                {authError ? (
                  <>
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h4 className="font-medium">Error Connecting to OneDrive</h4>
                    <p className="text-sm text-red-500 mt-2 mb-4">
                      {authError}
                    </p>
                    <Button onClick={handleAuthenticate} disabled={isAuthenticating}>
                      {isAuthenticating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Connecting...
                        </>
                      ) : (
                        'Connect to OneDrive'
                      )}
                    </Button>
                    {showDiagnostics && authStatus && (
                      <div className="mt-4 text-xs text-left w-full bg-gray-50 p-2 rounded border">
                        <p className="font-semibold">Authentication Status:</p>
                        <pre className="overflow-auto">{JSON.stringify(authStatus, null, 2)}</pre>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="font-medium">No OneDrive Files Found</h4>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                      Connect to your OneDrive account to view your files and folders.
                    </p>
                    <Button onClick={handleAuthenticate} disabled={isAuthenticating}>
                      {isAuthenticating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Connecting...
                        </>
                      ) : (
                        'Connect to OneDrive'
                      )}
                    </Button>
                  </>
                )}
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowDiagnostics(!showDiagnostics)} 
                  className="mt-4"
                >
                  {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "p-4 rounded-lg border flex flex-col hover:border-primary/50 transition-colors",
                      selectedFolder?.id === doc.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="flex flex-1 items-center cursor-pointer"
                        onClick={() => handleFolderClick(doc)}
                      >
                        <Folder className="h-5 w-5 mr-2 text-blue-400" />
                        <div className="font-medium overflow-hidden text-ellipsis">{doc.name}</div>
                      </div>
                      
                      {doc.isFolder && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNewFolderName(doc.name);
                              setFolderToRename(doc);
                              setIsRenamingFolder(true);
                            }}
                            className="h-6 w-6"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFolder(doc)}
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {doc.isFolder && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleFolderClick(doc)}
                      >
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {renderDiagnostics()}

          <div className="space-y-4">
            {isCreatingFolder ? (
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="New folder name"
                    disabled={isLoading}
                  />
                </div>
                <Button onClick={handleCreateFolder} disabled={isLoading || !newFolderName.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
                <Button variant="outline" onClick={() => setIsCreatingFolder(false)} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingFolder(true);
                  setNewFolderName('');
                }}
                disabled={isLoading}
                className="w-full"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create New Folder
              </Button>
            )}

            <Button
              onClick={() => {
                if (selectedFolder) {
                  onComplete({
                    path: selectedFolder.name,
                    folderId: selectedFolder.id
                  });
                }
              }}
              disabled={!selectedFolder || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Continue with {selectedFolder ? `"${selectedFolder.name}"` : 'selected folder'}
            </Button>
          </div>
        </div>
      )}

      {isDeletingFolder && folderToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Delete Folder</h3>
            <p className="mb-4">
              Are you sure you want to delete the folder "{folderToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeletingFolder(false);
                  setFolderToDelete(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteFolder}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 