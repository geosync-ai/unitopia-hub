import { useState, useEffect } from 'react';
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  FileText, FileSpreadsheet, Presentation, FileImage, 
  File, FileArchive, FileCode, Video, Music,
  Folder, ChevronRight, ChevronDown, ArrowLeft, RefreshCw
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

interface PathItem {
  id: string;
  name: string;
  source: 'SharePoint' | 'OneDrive';
}

export default function Documents() {
  const { 
    getSharePointDocuments, 
    getOneDriveDocuments,
    getFolderContents, 
    isLoading, 
    lastError
  } = useMicrosoftGraph();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState<'All' | 'SharePoint' | 'OneDrive'>('All');
  const [authError, setAuthError] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<PathItem[]>([]);

  const fetchDocuments = async (selectedSource: 'All' | 'SharePoint' | 'OneDrive' = source) => {
    setAuthError(false);
    setCurrentPath([]);
    setDocuments([]);
    setFilteredDocuments([]);
    console.log(`Fetching documents for source: ${selectedSource}`);
    
    try {
      let spDocs: Document[] | null = [];
      let odDocs: Document[] | null = [];

      const fetchPromises: Promise<Document[] | null>[] = [];

      if (selectedSource === 'All' || selectedSource === 'SharePoint') {
        console.log("Initiating SharePoint fetch...");
        fetchPromises.push(getSharePointDocuments());
      }
      if (selectedSource === 'All' || selectedSource === 'OneDrive') {
        console.log("Initiating OneDrive fetch...");
        fetchPromises.push(getOneDriveDocuments());
      }
      
      const results = await Promise.all(fetchPromises);
      
      let allDocuments: Document[] = [];
      results.forEach(docs => {
        if (docs) {
          allDocuments = [...allDocuments, ...docs];
        }
      });

      allDocuments.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setDocuments(allDocuments);
      setFilteredDocuments(allDocuments);
      console.log(`Fetched ${allDocuments.length} total documents.`);

    } catch (error: any) {
      console.error('Error fetching documents:', error);
      if (error.message?.includes('No account') || error.message?.includes('Authentication')) {
        setAuthError(true);
        toast.error('Authentication Error: Please re-authenticate.');
      } else {
        toast.error(`Failed to fetch documents: ${error.message}`);
      }
    } finally {
    }
  };

  useEffect(() => {
    fetchDocuments(source);
  }, [source]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredDocuments(filtered);
  }, [searchQuery, documents]);

  const handleReauthenticate = async () => {
    await fetchDocuments(source);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const navigateToFolder = async (folder: Document) => {
    if (!folder.isFolder || !folder.source) return;
    
    console.log(`Navigating to folder: ${folder.name} (ID: ${folder.id}, Source: ${folder.source})`);
    try {
      const folderContents = await getFolderContents(folder.id, folder.source);
      if (folderContents) {
        folderContents.sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name);
        });
        setDocuments(folderContents);
        setFilteredDocuments(folderContents);
        setCurrentPath(prevPath => [...prevPath, { id: folder.id, name: folder.name, source: folder.source! }]);
        setSearchQuery('');
      } else {
        setDocuments([]);
        setFilteredDocuments([]);
        setCurrentPath(prevPath => [...prevPath, { id: folder.id, name: folder.name, source: folder.source! }]);
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
        await fetchDocuments(source);
      } else {
        const parentFolder = newPath[newPath.length - 1];
        console.log(`Navigating up to parent: ${parentFolder.name} (ID: ${parentFolder.id}, Source: ${parentFolder.source})`);
        const folderContents = await getFolderContents(parentFolder.id, parentFolder.source);
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

  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Documents</h1>
        <p className="text-gray-500">Access and manage your SharePoint and OneDrive documents</p>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={source} onValueChange={(value: 'All' | 'SharePoint' | 'OneDrive') => setSource(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Documents</SelectItem>
                <SelectItem value="SharePoint">SharePoint</SelectItem>
                <SelectItem value="OneDrive">OneDrive</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[300px]"
            />
            <Button onClick={() => fetchDocuments(source)} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {authError ? (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
            <p className="text-red-600 mb-4">Authentication error. Please re-authenticate to access your documents.</p>
            <Button onClick={handleReauthenticate} variant="default">
              Re-authenticate
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
                   onClick={() => fetchDocuments(source)} 
                   disabled={isLoading}
                 >
                   Root ({source})
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
                            const contents = await getFolderContents(targetFolder.id, targetFolder.source);
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
                          <div className="text-xs text-muted-foreground mt-1">
                            Source: {doc.source}
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
