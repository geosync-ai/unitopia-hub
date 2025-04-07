import { useState, useEffect } from 'react';
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  FileText, FileSpreadsheet, Presentation, FileImage, 
  File, FileArchive, FileCode, Video, Music,
  Folder, ChevronRight, ChevronDown, ArrowLeft, RefreshCw
} from 'lucide-react';

export default function Documents() {
  const { getSharePointDocuments, getOneDriveDocuments, getFolderContents } = useMicrosoftGraph();
  const { isAuthenticated, loginWithMicrosoft } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState<'All' | 'SharePoint' | 'OneDrive'>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([]);

  const fetchDocuments = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setAuthError(false);
    
    try {
      let allDocuments: Document[] = [];
      
      if (source === 'All' || source === 'SharePoint') {
        const sharePointDocs = await getSharePointDocuments();
        if (sharePointDocs) {
          allDocuments = [...allDocuments, ...sharePointDocs];
        }
      }
      
      if (source === 'All' || source === 'OneDrive') {
        const oneDriveDocs = await getOneDriveDocuments();
        if (oneDriveDocs) {
          allDocuments = [...allDocuments, ...oneDriveDocs];
        }
      }
      
      setDocuments(allDocuments);
      setFilteredDocuments(allDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (error instanceof Error && error.message.includes('No accounts found')) {
        setAuthError(true);
      }
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [isAuthenticated, source]);

  useEffect(() => {
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [searchQuery, documents]);

  const handleReauthenticate = async () => {
    try {
      await loginWithMicrosoft();
      setAuthError(false);
      await fetchDocuments();
    } catch (error) {
      console.error('Re-authentication failed:', error);
      toast.error('Failed to re-authenticate');
    }
  };

  const toggleFolder = async (folderId: string, isExpanded: boolean) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (isExpanded) {
      newExpandedFolders.add(folderId);
    } else {
      newExpandedFolders.delete(folderId);
    }
    setExpandedFolders(newExpandedFolders);
  };

  const navigateToFolder = async (folder: Document) => {
    if (!folder.isFolder) return;
    
    setIsLoading(true);
    try {
      const folderContents = await getFolderContents(folder.id, folder.source);
      if (folderContents) {
        setDocuments(folderContents);
        setCurrentPath([...currentPath, { id: folder.id, name: folder.name }]);
      }
    } catch (error) {
      console.error('Error navigating to folder:', error);
      toast.error('Failed to load folder contents');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateUp = async () => {
    if (currentPath.length === 0) {
      await fetchDocuments();
      setCurrentPath([]);
      return;
    }

    const newPath = [...currentPath];
    newPath.pop();
    setCurrentPath(newPath);

    if (newPath.length === 0) {
      await fetchDocuments();
    } else {
      const parentFolder = newPath[newPath.length - 1];
      setIsLoading(true);
      try {
        const folderContents = await getFolderContents(parentFolder.id, 'SharePoint');
        if (folderContents) {
          setDocuments(folderContents);
        }
      } catch (error) {
        console.error('Error navigating up:', error);
        toast.error('Failed to load parent folder');
      } finally {
        setIsLoading(false);
      }
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
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Documents</h1>
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
            <Button onClick={fetchDocuments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Button variant="ghost" size="sm" onClick={navigateUp}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <span>/</span>
                {currentPath.map((folder, index) => (
                  <div key={folder.id} className="flex items-center">
                    <span className="text-gray-900">{folder.name}</span>
                    {index < currentPath.length - 1 && <span className="mx-2">/</span>}
                  </div>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No documents found
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      {doc.isFolder ? (
                        <Folder className="h-5 w-5 text-blue-500" />
                      ) : (
                        getFileIcon(doc.name)
                      )}
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(doc.lastModified)} • {formatFileSize(doc.size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.isFolder ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToFolder(doc)}
                        >
                          Open
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          Open
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
