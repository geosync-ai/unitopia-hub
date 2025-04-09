import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Cloud, FolderPlus, FolderOpen, ChevronLeft, ChevronRight, Folder, Edit2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OneDriveSetupProps {
  onComplete: (config: any) => void;
}

export const OneDriveSetup: React.FC<OneDriveSetupProps> = ({ onComplete }) => {
  const { toast: useToastToast } = useToast();
  const { isAuthenticated, loginWithMicrosoft } = useAuth();
  const { getOneDriveDocuments, getFolderContents, createFolder, renameFolder } = useMicrosoftGraph();
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

  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching OneDrive documents...');
      const oneDriveDocs = await getOneDriveDocuments();
      console.log('Fetched OneDrive documents:', oneDriveDocs);
      if (oneDriveDocs) {
        setDocuments(oneDriveDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setAuthError(`Failed to fetch documents: ${error.message}`);
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getOneDriveDocuments]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated, fetchDocuments]);

  const handleAuthenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      console.log('Starting Microsoft authentication...');
      await loginWithMicrosoft();
      console.log('Authentication initiated successfully');
      toast.success('Successfully connected to OneDrive');
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(`Authentication failed: ${error.message}`);
      toast.error('Failed to connect to OneDrive. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [loginWithMicrosoft]);

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
        // Refresh the current folder contents
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
        // Refresh the current folder contents
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

  const handlePathSelect = async () => {
    console.log('Continue button clicked');
    console.log('Current state:', {
      selectedFolder,
      isCreatingFolder,
      newFolderName,
      currentPath
    });

    // If we're in create folder mode, prioritize creating a new folder
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
          // Show success notification
          toast.success('Folder created successfully!', {
            description: `Created "${newFolderName}" in OneDrive`,
            duration: 2000,
          });
          
          // Wait a moment to show the notification
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
      ) : (
        <div className="space-y-4">
          {/* Breadcrumb navigation */}
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

          {/* Folder list */}
          <Card className="p-4 min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Loading files from OneDrive...</p>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we retrieve your OneDrive folders</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium">No items found</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  This folder is empty. Create a new folder or navigate to a different location.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents
                  .filter(doc => doc.isFolder)
                  .map(folder => (
                    <div
                      key={folder.id}
                      className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                        selectedFolder?.id === folder.id
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted/50 border border-border'
                      }`}
                      onClick={() => {
                        if (selectedFolder?.id === folder.id) {
                          handleFolderClick(folder);
                        } else {
                          setSelectedFolder(folder);
                        }
                      }}
                      onDoubleClick={() => handleFolderClick(folder)}
                    >
                      <Folder className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{folder.name}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Actions */}
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
    </div>
  );
}; 