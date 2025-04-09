import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Cloud, FolderPlus, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph';
import { useAuth } from '@/hooks/useAuth';

interface OneDriveSetupProps {
  onComplete: (config: any) => void;
}

export const OneDriveSetup: React.FC<OneDriveSetupProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const { isAuthenticated, loginWithMicrosoft } = useAuth();
  const { getOneDriveDocuments, getFolderContents } = useMicrosoftGraph();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Document | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated]);

  const fetchDocuments = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const oneDriveDocs = await getOneDriveDocuments();
      if (oneDriveDocs) {
        setDocuments(oneDriveDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch OneDrive documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      await loginWithMicrosoft();
      toast({
        title: "Authentication Successful",
        description: "Successfully connected to OneDrive",
      });
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Failed to connect to OneDrive. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navigateToFolder = async (folder: Document) => {
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
      toast({
        title: "Error",
        description: "Failed to load folder contents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateUp = async () => {
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
        toast({
          title: "Error",
          description: "Failed to load parent folder",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePathSelect = () => {
    if (selectedFolder) {
      onComplete({
        path: selectedFolder.name,
        folderId: selectedFolder.id,
        isNewFolder: false,
      });
    } else if (isCreatingNew && newFolderName) {
      onComplete({
        path: newFolderName,
        isNewFolder: true,
        folderName: newFolderName,
      });
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
              variant={!isCreatingNew ? "default" : "outline"}
              onClick={() => setIsCreatingNew(false)}
              className="flex-1"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Select Existing Folder
            </Button>
            <Button
              variant={isCreatingNew ? "default" : "outline"}
              onClick={() => setIsCreatingNew(true)}
              className="flex-1"
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Create New Folder
            </Button>
          </div>

          {isCreatingNew ? (
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
                  onClick={navigateUp}
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
                        navigateToFolder({ id: folder.id, name: folder.name } as Document);
                      }}
                    >
                      {folder.name}
                    </Button>
                    <span className="text-muted-foreground">/</span>
                  </React.Fragment>
                ))}
              </div>

              {/* Folder list */}
              <div className="border rounded-lg divide-y">
                {documents
                  .filter(doc => doc.isFolder)
                  .map(folder => (
                    <Button
                      key={folder.id}
                      variant="ghost"
                      className="w-full justify-start px-4 py-2"
                      onClick={() => navigateToFolder(folder)}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      {folder.name}
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  ))}
              </div>
            </div>
          )}

          <Button
            onClick={handlePathSelect}
            disabled={isCreatingNew ? !newFolderName : !selectedFolder}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}; 