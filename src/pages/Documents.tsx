
import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  File, 
  FileImage, 
  FileType, 
  FileArchive, 
  Download, 
  Share2, 
  Eye,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Interface for Document objects
interface DocumentItem {
  id: string | number;
  name: string;
  icon: React.ElementType;
  type: string;
  size: string;
  owner: string;
  modified: string;
  shared: boolean;
  source?: 'SharePoint' | 'OneDrive' | 'Local';
  url?: string;
}

const Documents = () => {
  const [folderView, setFolderView] = useState('all');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<'SharePoint' | 'OneDrive' | 'All'>('All');
  const { user, msGraphConfig } = useAuth();
  
  // Mock folders data
  const folders = [
    { id: 'all', name: 'All Documents', count: 124 },
    { id: 'shared', name: 'Shared with me', count: 56 },
    { id: 'recent', name: 'Recent', count: 12 },
    { id: 'important', name: 'Important', count: 8 },
  ];
  
  // Function to fetch documents from SharePoint and OneDrive
  const fetchMicrosoftDocuments = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would use Microsoft Graph API to fetch documents
      // For now, we'll simulate fetching documents
      
      // Wait for a simulated API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock documents based on selected source
      const mockSharePointDocs: DocumentItem[] = [
        { 
          id: 'sp1', 
          name: 'Strategic Plan 2023.pdf', 
          icon: FileType,
          type: 'PDF', 
          size: '2.4 MB', 
          owner: 'Thomas Smith', 
          modified: '2 days ago',
          shared: true,
          source: 'SharePoint',
          url: '#'
        },
        { 
          id: 'sp2', 
          name: 'Budget Forecast.xlsx', 
          icon: FileText,
          type: 'Excel', 
          size: '1.8 MB', 
          owner: 'Finance Team', 
          modified: '1 week ago',
          shared: true,
          source: 'SharePoint',
          url: '#'
        },
        { 
          id: 'sp3', 
          name: 'Project Roadmap.pptx', 
          icon: FileText,
          type: 'PowerPoint', 
          size: '3.2 MB', 
          owner: 'Project Team', 
          modified: '3 days ago',
          shared: true,
          source: 'SharePoint',
          url: '#'
        },
      ];
      
      const mockOneDriveDocs: DocumentItem[] = [
        { 
          id: 'od1', 
          name: 'Team Meeting Notes.docx', 
          icon: FileText,
          type: 'Word', 
          size: '567 KB', 
          owner: user?.name || 'You', 
          modified: 'Yesterday',
          shared: false,
          source: 'OneDrive',
          url: '#'
        },
        { 
          id: 'od2', 
          name: 'Company Logo.png', 
          icon: FileImage,
          type: 'Image', 
          size: '1.2 MB', 
          owner: user?.name || 'You', 
          modified: '2 weeks ago',
          shared: false,
          source: 'OneDrive',
          url: '#'
        },
        { 
          id: 'od3', 
          name: 'Resources.zip', 
          icon: FileArchive,
          type: 'Archive', 
          size: '25.7 MB', 
          owner: user?.name || 'You', 
          modified: '1 month ago',
          shared: true,
          source: 'OneDrive',
          url: '#'
        },
      ];
      
      // Filter documents based on selected source
      let filteredDocs: DocumentItem[] = [];
      if (source === 'SharePoint') {
        filteredDocs = mockSharePointDocs;
      } else if (source === 'OneDrive') {
        filteredDocs = mockOneDriveDocs;
      } else {
        filteredDocs = [...mockSharePointDocs, ...mockOneDriveDocs];
      }
      
      // Filter by folder view
      if (folderView === 'shared') {
        filteredDocs = filteredDocs.filter(doc => doc.shared);
      } else if (folderView === 'recent') {
        filteredDocs = filteredDocs.filter(doc => 
          doc.modified === 'Yesterday' || doc.modified === '2 days ago' || doc.modified === '3 days ago'
        );
      } else if (folderView === 'important') {
        // For demo purposes, just get a few random files as "important"
        filteredDocs = filteredDocs.filter((_, index) => index % 3 === 0);
      }
      
      setDocuments(filteredDocs);
      toast.success('Documents loaded successfully');
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load documents when component mounts or when source/folder changes
  useEffect(() => {
    if (msGraphConfig) {
      fetchMicrosoftDocuments();
    } else {
      // Load mock documents if no Microsoft integration
      setDocuments([
        { 
          id: 1, 
          name: 'Strategic Plan 2023.pdf', 
          icon: FileType,
          type: 'PDF', 
          size: '2.4 MB', 
          owner: 'Thomas Smith', 
          modified: '2 days ago',
          shared: true,
          source: 'Local'
        },
        { 
          id: 2, 
          name: 'Budget Forecast.xlsx', 
          icon: FileText,
          type: 'Excel', 
          size: '1.8 MB', 
          owner: 'Finance Team', 
          modified: '1 week ago',
          shared: true,
          source: 'Local'
        },
        { 
          id: 3, 
          name: 'Team Meeting Notes.docx', 
          icon: FileText,
          type: 'Word', 
          size: '567 KB', 
          owner: 'You', 
          modified: 'Yesterday',
          shared: false,
          source: 'Local'
        },
        { 
          id: 4, 
          name: 'Project Roadmap.pptx', 
          icon: FileText,
          type: 'PowerPoint', 
          size: '3.2 MB', 
          owner: 'Project Team', 
          modified: '3 days ago',
          shared: true,
          source: 'Local'
        },
        { 
          id: 5, 
          name: 'Company Logo.png', 
          icon: FileImage,
          type: 'Image', 
          size: '1.2 MB', 
          owner: 'Marketing', 
          modified: '2 weeks ago',
          shared: false,
          source: 'Local'
        },
        { 
          id: 6, 
          name: 'Resources.zip', 
          icon: FileArchive,
          type: 'Archive', 
          size: '25.7 MB', 
          owner: 'IT Department', 
          modified: '1 month ago',
          shared: true,
          source: 'Local'
        },
      ]);
    }
  }, [msGraphConfig, source, folderView]);

  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-4">
          <Card className="animate-fade-in gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Document Center</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setFolderView(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center ${
                      folderView === folder.id
                        ? 'bg-intranet-primary text-white'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <span>{folder.name}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {folder.count}
                    </span>
                  </button>
                ))}
              </div>
              
              <Button className="w-full mt-4 btn-hover-effect">
                <Plus size={16} className="mr-1" />
                New Folder
              </Button>
            </CardContent>
          </Card>
          
          {msGraphConfig && (
            <Card className="animate-fade-in gradient-card" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['All', 'SharePoint', 'OneDrive'].map((src) => (
                    <button
                      key={src}
                      onClick={() => setSource(src as 'SharePoint' | 'OneDrive' | 'All')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        source === src
                          ? 'bg-intranet-primary text-white'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <span>{src}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="animate-fade-in gradient-card" style={{ animationDelay: `${msGraphConfig ? '0.2s' : '0.1s'}` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Used Space</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                    <div className="h-full bg-gradient-to-r from-intranet-primary to-intranet-secondary rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    6.5 GB of 10 GB used
                  </div>
                </div>
                
                <Button variant="outline" className="w-full btn-hover-effect">
                  Request More Space
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold animate-fade-in">Documents</h1>
            <div className="flex gap-2">
              {msGraphConfig && (
                <Button 
                  className="animate-fade-in btn-hover-effect" 
                  variant="outline"
                  onClick={fetchMicrosoftDocuments}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
              <Button className="animate-fade-in btn-hover-effect">
                <Plus size={16} className="mr-1" />
                Upload New
              </Button>
            </div>
          </div>
          
          {!msGraphConfig && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded animate-fade-in">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Microsoft integration not configured</h3>
                  <p className="text-sm text-amber-700">
                    Contact your administrator to set up SharePoint and OneDrive integration.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-intranet-primary" />
                </div>
              ) : documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[400px]">Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Modified</TableHead>
                      {msGraphConfig && <TableHead>Source</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc, index) => (
                      <TableRow key={doc.id} className="table-row-hover animate-fade-in" style={{ animationDelay: `${0.3 + index * 0.05}s` }}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <doc.icon className="h-5 w-5 text-intranet-primary" />
                            <span>{doc.name}</span>
                            {doc.shared && (
                              <span className="ml-2 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                Shared
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell>{doc.owner}</TableCell>
                        <TableCell>{doc.modified}</TableCell>
                        {msGraphConfig && (
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              doc.source === 'SharePoint' 
                                ? 'bg-blue-100 text-blue-800' 
                                : doc.source === 'OneDrive'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.source}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 icon-hover-effect">
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 icon-hover-effect">
                              <Download size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 icon-hover-effect">
                              <Share2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex justify-center items-center p-8 text-gray-500">
                  No documents found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Documents;
