import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Cloud, FolderPlus, FolderOpen, ChevronLeft, ChevronRight, Folder, Edit2 } from 'lucide-react';
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

  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const oneDriveDocs = await getOneDriveDocuments();
      if (oneDriveDocs) {
        setDocuments(oneDriveDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
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
    try {
      await loginWithMicrosoft();
      toast.success('Successfully connected to OneDrive');
    } catch (error) {
      toast.error('Failed to connect to OneDrive. Please try again.');
    }
  }, [loginWithMicrosoft]);

  const handleFolderClick = useCallback(async (folder: Document) => {
    if (!folder.isFolder) return;
    
    setIsLoading(true);
    try {
      const folderContents = await getFolderContents(folder.id, 'OneDrive');
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

      {!isAuthenticated ? (
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Cloud className="h-12 w-12 text-blue-500" />
            <Button onClick={handleAuthenticate}>
              Connect to OneDrive
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button
              variant={!isCreatingFolder ? "default" : "outline"}
              onClick={() => setIsCreatingFolder(false)}
              className="flex-1"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Select Existing Folder
            </Button>
            <Button
              variant={isCreatingFolder ? "default" : "outline"}
              onClick={() => setIsCreatingFolder(true)}
              className="flex-1"
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Create New Folder
            </Button>
          </div>

          {isCreatingFolder ? (
            <div className="space-y-2">
              <Label htmlFor="folderName">New Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Breadcrumb navigation */}
              <div className="flex items-center space-x-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNavigateUp}
                  disabled={currentPath.length === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground">/</span>
                {currentPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newPath = currentPath.slice(0, index + 1);
                        setCurrentPath(newPath);
                        handleFolderClick({ id: folder.id, name: folder.name } as Document);
                      }}
                    >
                      {folder.name}
                    </Button>
                    <span className="text-muted-foreground">/</span>
                  </React.Fragment>
                ))}
              </div>

              {/* Folder list */}
              <div className="grid grid-cols-1 gap-2">
                {documents
                  .filter(doc => doc.isFolder)
                  .map(folder => (
                    <Card
                      key={folder.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleFolderClick(folder)}
                    >
                      <div className="flex items-center space-x-2">
                        <Folder className="h-5 w-5 text-blue-500" />
                        <span>{folder.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderToRename(folder);
                            setIsRenamingFolder(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolder(folder);
                            setIsCreatingFolder(true);
                          }}
                        >
                          <FolderPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {isRenamingFolder && (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter new folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder()}
              />
              <Button onClick={handleRenameFolder} disabled={isLoading}>
                Rename
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsRenamingFolder(false);
                  setFolderToRename(null);
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          <Button
            onClick={handlePathSelect}
            disabled={isCreatingFolder ? !newFolderName : !selectedFolder}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}; 