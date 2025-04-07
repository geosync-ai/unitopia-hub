import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftGraph } from '@/hooks/useMicrosoftGraph';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileIcon, Cloud, FolderIcon, Loader2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

interface Document {
  id: string;
  name: string;
  url: string;
  lastModified: string;
  size: number;
  source: 'SharePoint' | 'OneDrive';
}

const Documents = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getSharePointDocuments, getOneDriveDocuments } = useMicrosoftGraph();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [source, setSource] = useState<'SharePoint' | 'OneDrive' | 'All'>('All');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDocuments();
  }, [isAuthenticated, source]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      let allDocs: Document[] = [];

      if (source === 'SharePoint' || source === 'All') {
        const sharePointDocs = await getSharePointDocuments();
        if (sharePointDocs) {
          allDocs = [...allDocs, ...sharePointDocs.map(doc => ({
            ...doc,
            source: 'SharePoint' as const
          }))];
        }
      }

      if (source === 'OneDrive' || source === 'All') {
        const oneDriveDocs = await getOneDriveDocuments();
        if (oneDriveDocs) {
          allDocs = [...allDocs, ...oneDriveDocs.map(doc => ({
            ...doc,
            source: 'OneDrive' as const
          }))];
        }
      }

      setDocuments(allDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Documents</h1>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button onClick={fetchDocuments} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            {['All', 'SharePoint', 'OneDrive'].map((src) => (
              <Button
                key={src}
                variant={source === src ? 'default' : 'outline'}
                onClick={() => setSource(src as 'SharePoint' | 'OneDrive' | 'All')}
                className="flex items-center gap-2"
              >
                {src === 'SharePoint' && <Cloud size={14} className="mr-2" />}
                {src === 'OneDrive' && <FolderIcon size={14} className="mr-2" />}
                {src}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {doc.source === 'SharePoint' && <Cloud size={14} className="mr-2 text-blue-600" />}
                  {doc.source === 'OneDrive' && <FolderIcon size={14} className="mr-2 text-green-600" />}
                  {doc.name}
                </CardTitle>
                <CardDescription>
                  {new Date(doc.lastModified).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-500">
                  Size: {formatFileSize(doc.size)}
                </p>
                <p className="text-sm text-gray-500">
                  Source: {doc.source}
                </p>
              </CardContent>
              <CardFooter className="mt-auto pt-2">
                <Button asChild variant="outline" className="w-full">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <FileIcon size={14} />
                    Open Document
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading documents...</p>
          </div>
        )}

        {!isLoading && filteredDocuments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No documents found.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Documents;
