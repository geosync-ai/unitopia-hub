
import React, { useState } from 'react';
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
  FilePdf, 
  FileArchive, 
  Download, 
  Share2, 
  Eye,
  Plus
} from 'lucide-react';

const Documents = () => {
  const [folderView, setFolderView] = useState('all');
  
  // Mock folders data
  const folders = [
    { id: 'all', name: 'All Documents', count: 124 },
    { id: 'shared', name: 'Shared with me', count: 56 },
    { id: 'recent', name: 'Recent', count: 12 },
    { id: 'important', name: 'Important', count: 8 },
  ];
  
  // Mock documents data
  const documents = [
    { 
      id: 1, 
      name: 'Strategic Plan 2023.pdf', 
      icon: FilePdf,
      type: 'PDF', 
      size: '2.4 MB', 
      owner: 'Thomas Smith', 
      modified: '2 days ago',
      shared: true 
    },
    { 
      id: 2, 
      name: 'Budget Forecast.xlsx', 
      icon: FileText,
      type: 'Excel', 
      size: '1.8 MB', 
      owner: 'Finance Team', 
      modified: '1 week ago',
      shared: true 
    },
    { 
      id: 3, 
      name: 'Team Meeting Notes.docx', 
      icon: FileText,
      type: 'Word', 
      size: '567 KB', 
      owner: 'You', 
      modified: 'Yesterday',
      shared: false 
    },
    { 
      id: 4, 
      name: 'Project Roadmap.pptx', 
      icon: FileText,
      type: 'PowerPoint', 
      size: '3.2 MB', 
      owner: 'Project Team', 
      modified: '3 days ago',
      shared: true 
    },
    { 
      id: 5, 
      name: 'Company Logo.png', 
      icon: FileImage,
      type: 'Image', 
      size: '1.2 MB', 
      owner: 'Marketing', 
      modified: '2 weeks ago',
      shared: false 
    },
    { 
      id: 6, 
      name: 'Resources.zip', 
      icon: FileArchive,
      type: 'Archive', 
      size: '25.7 MB', 
      owner: 'IT Department', 
      modified: '1 month ago',
      shared: true 
    },
  ];

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
          
          <Card className="animate-fade-in gradient-card" style={{ animationDelay: '0.1s' }}>
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
            <Button className="animate-fade-in btn-hover-effect">
              <Plus size={16} className="mr-1" />
              Upload New
            </Button>
          </div>
          
          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px]">Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="table-row-hover animate-fade-in" style={{ animationDelay: `${0.3 + doc.id * 0.05}s` }}>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Documents;
