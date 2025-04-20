import { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  FileText, FileSpreadsheet, Presentation, FileImage, 
  File, FileArchive, FileCode, Video, Music,
  Folder, ArrowLeft, RefreshCw
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

interface PathItem {
  id: string;
  name: string;
}

export default function Documents() {
  const { 
    getOneDriveDocuments,
    getFolderContents, 
    isLoading, 
    lastError,
    handleLogin
  } = useMicrosoftGraph();
  const isAuthenticated = useIsAuthenticated();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authError, setAuthError] = useState(false);
  const [currentPath, setCurrentPath] = useState<PathItem[]>([]);

  const fetchDocuments = async () => {
    setAuthError(false);
    setCurrentPath([]);
    setDocuments([]);
    setFilteredDocuments([]);
    console.log(`Fetching OneDrive root documents...`);
    
    try {
      const odDocs = await getOneDriveDocuments();
      
      let allDocuments: Document[] = [];
      if (odDocs) {
        allDocuments = [...odDocs];
      }

      allDocuments.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setDocuments(allDocuments);
      setFilteredDocuments(allDocuments);
      console.log(`Fetched ${allDocuments.length} OneDrive documents.`);

    } catch (error: any) {
      console.error('Error fetching OneDrive documents:', error);
      if (error.message?.includes('No account') || error.message?.includes('Authentication')) {
        setAuthError(true);
        toast.error('Authentication Error: Please re-authenticate.');
      } else {
        toast.error(`Failed to fetch documents: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated via MSAL, fetching documents.");
      fetchDocuments();
    } else {
       console.log("User is NOT authenticated via MSAL, skipping document fetch.");
       setDocuments([]);
       setFilteredDocuments([]);
       setCurrentPath([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredDocuments(filtered);
  }, [searchQuery, documents]);

  const handleReauthenticate = async () => {
    if (!isAuthenticated) {
      await handleLogin();
    } else {
      await fetchDocuments(); 
    }
  };

  const navigateToFolder = async (folder: Document) => {
    if (!folder.isFolder) return; 
    
    console.log(`Navigating to folder: ${folder.name} (ID: ${folder.id})`);
    try {
      const folderContents = await getFolderContents(folder.id);
      if (folderContents) {
        folderContents.sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name);
        });
        setDocuments(folderContents);
        setFilteredDocuments(folderContents);
        setCurrentPath(prevPath => [...prevPath, { id: folder.id, name: folder.name }]);
        setSearchQuery('');
      } else {
        setDocuments([]);
        setFilteredDocuments([]);
        setCurrentPath(prevPath => [...prevPath, { id: folder.id, name: folder.name }]);
        setSearchQuery('');
        console.log(`Folder ${folder.name} is empty or content couldn't be fetched.`);
      }
    } catch (error: any) {
      console.error('Error navigating to folder:', error);
      toast.error(`Failed to load folder contents: ${error.message}`);
    }
  };

  const navigateUp = async () => {
    if (currentPath.length === 0) return;

    const newPath = [...currentPath];
    newPath.pop();
    
    console.log(`Navigating up. New path length: ${newPath.length}`);

    try {
      if (newPath.length === 0) {
        console.log("Navigating up to root view.");
        await fetchDocuments();
      } else {
        const parentFolder = newPath[newPath.length - 1];
        console.log(`Navigating up to parent: ${parentFolder.name} (ID: ${parentFolder.id})`);
        const folderContents = await getFolderContents(parentFolder.id);
        if (folderContents) {
           folderContents.sort((a, b) => {
             if (a.isFolder && !b.isFolder) return -1;
             if (!a.isFolder && b.isFolder) return 1;
             return a.name.localeCompare(b.name);
           });
          setDocuments(folderContents);
          setFilteredDocuments(folderContents);
        } else {
          setDocuments([]);
          setFilteredDocuments([]);
          console.log(`Parent folder ${parentFolder.name} is empty or content couldn't be fetched.`);
        }
        setCurrentPath(newPath);
        setSearchQuery('');
      }
    } catch (error: any) {
      console.error('Error navigating up:', error);
      toast.error(`Failed to load parent folder: ${error.message}`);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      case 'pdf':
        return <File className="h-5 w-5 text-red-500" />;
      case 'zip':
      case 'rar':
        return <FileArchive className="h-5 w-5 text-yellow-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'js':
      case 'ts':
      case 'html':
      case 'css':
        return <FileCode className="h-5 w-5 text-blue-500" />;
      case 'mp4':
      case 'mov':
        return <Video className="h-5 w-5 text-purple-500" />;
      case 'mp3':
      case 'wav':
        return <Music className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold mb-4">Access OneDrive Documents</h1>
          <p className="text-muted-foreground mb-6">Please sign in with your Microsoft account to view your documents.</p>
          <Button onClick={handleLogin} variant="default" disabled={isLoading}> 
            Sign In with Microsoft
          </Button>
          {lastError && <p className="text-red-500 mt-4 text-sm">Error: {lastError}</p>}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">OneDrive Documents</h1>
        <p className="text-gray-500">Access and manage your OneDrive documents</p>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search OneDrive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[300px]"
            />
            <Button onClick={fetchDocuments} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {authError ? (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
            <p className="text-red-600 mb-4">Authentication error. Please re-authenticate to access your documents.</p>
            <Button onClick={handleLogin} variant="default" disabled={isLoading}>
              Re-authenticate with Microsoft
            </Button>
          </div>
        ) : (
          <>
            {currentPath.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2 flex-wrap">
                <Button variant="ghost" size="sm" onClick={navigateUp} disabled={isLoading} className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <span>/</span>
                <Button 
                   variant="link" 
                   size="sm" 
                   className="text-gray-600 px-1 h-auto py-0" 
                   onClick={fetchDocuments} 
                   disabled={isLoading}
                 >
                   OneDrive Root
                 </Button>
                 <span>/</span>
                {currentPath.map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-1">
                    {index < currentPath.length - 1 ? (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-gray-600 px-1 h-auto py-0"
                        onClick={async () => {
                          const pathSlice = currentPath.slice(0, index + 1);
                          const targetFolder = pathSlice[pathSlice.length - 1];
                          setCurrentPath(pathSlice);
                          try {
                            const contents = await getFolderContents(targetFolder.id);
                            if (contents) {
                               contents.sort((a, b) => {
                                if (a.isFolder && !b.isFolder) return -1;
                                if (!a.isFolder && b.isFolder) return 1;
                                return a.name.localeCompare(b.name);
                              });
                              setDocuments(contents);
                              setFilteredDocuments(contents);
                            } else {
                              setDocuments([]);
                              setFilteredDocuments([]);
                            }
                            setSearchQuery('');
                          } catch(error: any) {
                             toast.error(`Failed to load folder: ${error.message}`);
                          }
                        }}
                        disabled={isLoading}
                      >
                        {folder.name}
                      </Button>
                    ) : (
                      <span className="text-gray-900 font-medium px-1">{folder.name}</span>
                    )}
                    {index < currentPath.length - 1 && <span className="text-gray-400">/</span>}
                  </div>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-intranet-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer border border-border"
                      onClick={() => doc.isFolder ? navigateToFolder(doc) : window.open(doc.url, '_blank')}
                      title={doc.name}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {doc.isFolder ? (
                            <Folder className="h-6 w-6 text-yellow-500" />
                          ) : (
                            getFileIcon(doc.name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate text-sm">{doc.name}</h3>
                          <div className="text-xs text-muted-foreground mt-1">
                            {doc.isFolder ? (
                              <span className="italic">Folder</span> 
                            ) : (
                              <>
                                <span>{formatFileSize(doc.size)}</span>
                                <span className="mx-1">•</span>
                                <span>{formatDate(doc.lastModified)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    {searchQuery ? 'No documents match your search.' : 'No documents found in this location.'}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
