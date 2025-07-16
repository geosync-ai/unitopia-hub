import { useState, useEffect, useMemo } from 'react';
import { useMsal } from "@azure/msal-react";
import { useMicrosoftGraph, Document } from '@/hooks/useMicrosoftGraph.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  FileText, FileSpreadsheet, Presentation, FileImage, 
  File, FileArchive, FileCode, Video, Music,
  Folder, ArrowLeft, RefreshCw,
  PlusCircle, User, Users, Building, ChevronDown, ChevronRight, Globe
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import AddDocumentModal from '@/components/custom/AddDocumentModal';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Define a more comprehensive interface for display purposes
interface DisplayableDocument {
  id: string; // Unique ID (from OneDrive or Supabase)
  name: string; // Display name (file name or title)
  url: string;  // URL to open (webUrl for OneDrive, sharepoint_url for Supabase link)
  lastModified: string; // Date string
  size: number; // File size in bytes
  isFolder?: boolean; // True if it's an OneDrive folder
  source: 'OneDrive' | 'SharePointLink'; // To distinguish the origin
  originalFileName?: string; // For SharePointLink, to help with getFileIcon
  description?: string; // For SharePointLink
  tags?: string; // For SharePointLink
}

interface PathItem {
  id: string;
  name: string;
}

// New Primary Tab Structure
const primaryTabsConfig = [
  { id: 'my-documents', label: 'My Documents', icon: <User className="mr-2 h-4 w-4" /> },
  { id: 'company-wide', label: 'Organizational Shared Documents', icon: <Building className="mr-2 h-4 w-4" />, defaultSecondary: 'all-company' },
  { id: 'team-unit', label: 'Team / Unit Documents', icon: <Users className="mr-2 h-4 w-4" />, defaultSecondary: 'team-all' },
  { id: 'external-shared', label: 'External Shared Documents', icon: <Globe className="mr-2 h-4 w-4" />, defaultSecondary: 'all-external' },
];

// --- Data structure for Company-Wide Sub-Categories with Hierarchy ---
interface CompanyWideSubCategoryItem {
  id: string;
  label: string;
  dbSubCategoryValue?: string; // Explicit DB value for fetching, if different from a mapped label
  children?: CompanyWideSubCategoryItem[];
}

const companyWideSubCategories: CompanyWideSubCategoryItem[] = [
  { id: 'all-company', label: 'All Company Documents' }, // Remains the default view for all
  {
    id: 'governance-legal-parent',
    label: 'Governance & Legal',
    // This parent is for grouping; does not directly map to a single dbSubCategoryValue unless defined
    children: [
      { id: 'legal-compliance-docs', label: 'Legal & Compliance Documents', dbSubCategoryValue: 'Legal & Compliance Documents' },
      { id: 'regulatory-framework', label: 'Regulatory & Legal Framework' },
      { id: 'internal-compliance', label: 'Internal Compliance Policies & Procedures' },
      { id: 'contracts-agreements', label: 'Contracts & Agreements' },
      { id: 'data-privacy', label: 'Data Privacy & Protection' },
      { id: 'ethics-conduct', label: 'Ethics & Code of Conduct' },
      { id: 'litigation-disputes', label: 'Litigation & Dispute Resolution' },
      { id: 'compliance-audits', label: 'Compliance Audits & Assessments' },
      { id: 'licenses-permits', label: 'Licenses & Permits' },
      { id: 'corp-governance', label: 'Corporate Governance & Board Resolutions' },
      { id: 'legal-opinions', label: 'Legal Opinions & Advice' },
    ]
  },
  {
    id: 'strategy-management-parent',
    label: 'Company Strategy & Management',
    children: [
      { id: 'corporate-plan', label: 'Corporate & Strategic', dbSubCategoryValue: 'Corporate Plan Documents' },
      { id: 'reports', label: 'Reports', dbSubCategoryValue: 'Reports' },
      { id: 'policies', label: 'Policies & Procedures', dbSubCategoryValue: 'Policies' },
      { id: 'guidelines-procedures', label: 'Guidelines & Procedures', dbSubCategoryValue: 'Guidelines & Procedures' }, // No longer a parent of Training & Dev
    ]
  },
  {
    id: 'comms-branding-parent',
    label: 'Communication & Branding',
    children: [
      { id: 'branding-comms', label: 'Branding & Communications', dbSubCategoryValue: 'Branding & Communications' },
      { id: 'forms', label: 'Forms & Templates', dbSubCategoryValue: 'Forms' },
    ]
  },
  {
    id: 'training-hr-parent',
    label: 'Training & Human Resources',
    children: [
      { id: 'training-dev', label: 'Training & Development Resources', dbSubCategoryValue: 'Training & Development Resources' }
    ]
  },
  {
    id: 'it-systems-parent',
    label: 'IT & Systems',
    children: [
      { id: 'it-system-docs', label: 'IT & System Documentation', dbSubCategoryValue: 'IT & System Documentation' }
    ]
  },
  {
    id: 'records-archives-parent',
    label: 'Records & Archives',
    children: [
      { id: 'records-management', label: 'Records Management & Retention' }, // New conceptual category
      { id: 'historical-archives', label: 'Historical & Archives', dbSubCategoryValue: 'Historical & Archives' }
    ]
  },
];

// Map old scpngSharedSubCategories labels (used in DB) to new IDs if needed for complex cases,
// but dbSubCategoryValue on items is now preferred.
// This map is mainly for ensuring `initialSubCategory` in AddDocumentModal can work if it needs an old label.
const oldLabelToNewIdMap: Record<string, string> = {
  'Policies': 'policies',
  'Forms': 'forms',
  'Corporate Plan Documents': 'corporate-plan',
  'Reports': 'reports',
  'Branding & Communications': 'branding-comms',
  'Guidelines & Procedures': 'guidelines-procedures-parent', // Parent now represents this
  'Training & Development Resources': 'training-dev',
  'IT & System Documentation': 'it-system-docs',
  'Legal & Compliance Documents': 'legal-compliance-parent', // Parent now represents this
  'Historical & Archives': 'historical-archives',
};
// And the reverse (primarily for `AddDocumentModal` if it expects an old sub-category label based on active ID)
const newIdToOldLabelMap: Record<string, string> = Object.fromEntries(
    companyWideSubCategories.flatMap(item => {
        const entries: [string, string][] = [];
        if (item.dbSubCategoryValue) {
            entries.push([item.id, item.dbSubCategoryValue]);
        }
        if (item.children) {
            item.children.forEach(child => {
                if (child.dbSubCategoryValue) {
                    entries.push([child.id, child.dbSubCategoryValue]);
                }
            });
        }
        return entries;
    }).filter(([id, label]) => id && label) // Filter out any undefined due to missing dbSubCategoryValue
);


// Define secondary navigation items based on primary tab
// Note: companyWideSubCategories is now the source for 'company-wide'
const secondaryNavConfig: Record<string, { id: string; label: string; sourceCategory?: string; children?: any[] }[]> = {
  'my-documents': [],
  'company-wide': companyWideSubCategories, // Use the new hierarchical structure
  'team-unit': [
    { id: 'team-all', label: 'All Team/Unit Documents' },
    { id: 'division-shared', label: 'Division Shared', sourceCategory: 'Unit Shared' },
  ],
  'external-shared': [
    { id: 'all-external', label: 'All External Documents' },
  ],
};

// For AddDocumentModal, these are the Supabase `shared_category` values
const shareableCategoriesForModal = ['SCPNG Shared Documents', 'Unit Shared'];


export default function Documents() {
  const { 
    getOneDriveDocuments,
    getFolderContents, 
    isLoading: isOneDriveLoading, 
    handleLogin,
    uploadBinaryFileToSharePoint
  } = useMicrosoftGraph();
  const { user } = useSupabaseAuth();
  const [documents, setDocuments] = useState<DisplayableDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DisplayableDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authError, setAuthError] = useState(false); 
  const [currentPath, setCurrentPath] = useState<PathItem[]>([]); 
  
  const [activePrimaryTab, setActivePrimaryTab] = useState<string>(primaryTabsConfig[1].id); 
  const [activeSecondaryNav, setActiveSecondaryNav] = useState<string>(primaryTabsConfig[1].defaultSecondary);
  const [expandedCompanyWideItems, setExpandedCompanyWideItems] = useState<Record<string, boolean>>({});

  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  console.log("Documents component. Primary:", activePrimaryTab, "Secondary:", activeSecondaryNav, "isLoading:", isLoading, "Expanded:", expandedCompanyWideItems);

  const currentSharePointCategoriesForModal = useMemo(() => {
    if (activePrimaryTab === 'company-wide') return ['SCPNG Shared Documents'];
    if (activePrimaryTab === 'team-unit') {
        // Since 'General Shared' is removed as a distinct UI choice,
        // 'Unit Shared' (representing Division Shared) is the main category here.
        return ['Unit Shared']; 
    }
    return [];
  }, [activePrimaryTab, activeSecondaryNav]);
  
  const currentSubCategoriesForModal = useMemo(() => {
    // Provides a flat list of all possible DB sub-category *labels* for the modal
    // when 'SCPNG Shared Documents' is the target.
    if (activePrimaryTab === 'company-wide') {
        return companyWideSubCategories
            .flatMap(item => item.dbSubCategoryValue ? [item.dbSubCategoryValue] : (item.children?.map(c => c.dbSubCategoryValue).filter(Boolean) || []))
            .filter(Boolean) as string[]; // Ensure only defined strings
    }
    return undefined; // Or an empty array if preferred for other primary tabs
  }, [activePrimaryTab]);


  const fetchPersonalDocumentsRoot = async () => {
    setAuthError(false);
    setCurrentPath([]);
    setDocuments([]);
    setIsLoading(true);
    try {
      const odDocs = await getOneDriveDocuments();
      const mappedDocs: DisplayableDocument[] = (odDocs || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl,
        lastModified: item.lastModifiedDateTime || item.lastModified, 
        size: item.size,
        isFolder: !!item.folder, 
        source: 'OneDrive',
        originalFileName: item.name,
      }));
      mappedDocs.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      setDocuments(mappedDocs);
    } catch (error: any) {
      console.error('fetchPersonalDocumentsRoot Error:', error);
      if (error.message?.includes('No account') || error.message?.includes('Authentication') || error.code === 'UserLoginRequired') {
        setAuthError(true);
        toast.error('Authentication Error for My Documents. Please re-authenticate.');
      } else {
        toast.error(`Failed to fetch My Documents: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const findCategoryById = (id: string, categories: CompanyWideSubCategoryItem[]): CompanyWideSubCategoryItem | null => {
    for (const category of categories) {
        if (category.id === id) return category;
        if (category.children) {
            const foundInChildren = findCategoryById(id, category.children);
            if (foundInChildren) return foundInChildren;
        }
    }
    return null;
  };

  const loadData = async () => {
    console.log(`Loading data for Primary: ${activePrimaryTab}, Secondary: ${activeSecondaryNav}`);
    setSearchQuery(''); 
    setDocuments([]); 
    setCurrentPath([]); 
    setAuthError(false); 
    setIsLoading(true);

    if (activePrimaryTab === 'my-documents') {
      await fetchPersonalDocumentsRoot();
    } else if (activePrimaryTab === 'company-wide') {
      try {
        let query = supabase
          .from('company_documents')
          .select('id, title, description, tags, sharepoint_url, file_name, file_type, file_size, created_at, sub_category, shared_category')
          .eq('shared_category', 'SCPNG Shared Documents') // Always this for company-wide
          .eq('is_archived', false);

        const selectedNavItem = findCategoryById(activeSecondaryNav, companyWideSubCategories);
        const dbFilterValue = selectedNavItem?.dbSubCategoryValue;

        if (activeSecondaryNav === 'all-company') {
          // No additional sub_category filter needed for 'all-company'
        } else if (dbFilterValue) {
          query = query.eq('sub_category', dbFilterValue);
        } else {
          // This is a conceptual category (like new legal items) with no direct dbSubCategoryValue
          // So, we expect no documents unless specific tagging is implemented later.
          console.warn(`No dbSubCategoryValue for ${activeSecondaryNav}. Expecting no documents unless tagged specifically.`);
          setDocuments([]);
          setIsLoading(false);
          return; // Exit early
        }
        
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        const fetchedSharedDocuments: DisplayableDocument[] = data.map((doc: any) => ({
          id: doc.id, name: doc.title, url: doc.sharepoint_url, lastModified: doc.created_at,
          size: doc.file_size, isFolder: false, source: 'SharePointLink',
          originalFileName: doc.file_name, description: doc.description, tags: doc.tags,
        }));
        setDocuments(fetchedSharedDocuments);
      } catch (error: any) {
        console.error(`Error fetching Company-Wide docs for ${activeSecondaryNav}:`, error);
        toast.error(`Failed to load documents: ${error.message}`);
        setDocuments([]);
      }
    } else if (activePrimaryTab === 'team-unit') {
      try {
        let query = supabase
          .from('company_documents')
          .select('id, title, description, tags, sharepoint_url, file_name, file_type, file_size, created_at, sub_category, shared_category')
          .eq('is_archived', false);
        
        // Updated logic for 'team-unit' data fetching
        if (activeSecondaryNav === 'team-all' || activeSecondaryNav === 'division-shared') {
          query = query.eq('shared_category', 'Unit Shared'); 
        } else {
          // Fallback or if more specific team/unit types were added and not handled yet
          console.warn(`Unknown or unhandled secondary nav for team-unit: ${activeSecondaryNav}. Loading no documents.`);
          setDocuments([]);
          setIsLoading(false); return;
        }

        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        const fetchedDocs: DisplayableDocument[] = data.map((doc: any) => ({
          id: doc.id, name: doc.title, url: doc.sharepoint_url, lastModified: doc.created_at,
          size: doc.file_size, isFolder: false, source: 'SharePointLink',
          originalFileName: doc.file_name, description: doc.description, tags: doc.tags,
        }));
        setDocuments(fetchedDocs);
      } catch (error: any) {
        console.error(`Error fetching Team/Unit docs for ${activeSecondaryNav}:`, error);
        toast.error(`Failed to load documents: ${error.message}`);
        setDocuments([]);
      }
    } else if (activePrimaryTab === 'external-shared') {
      // No specific logic for 'external-shared' yet, will show no documents
      console.warn(`Data fetching not implemented for primary tab: ${activePrimaryTab}.`);
      setDocuments([]);
    } else {
      console.warn(`Data fetching not implemented for primary tab: ${activePrimaryTab}.`);
      setDocuments([]);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [activePrimaryTab, activeSecondaryNav]); 

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(lowerCaseQuery) ||
      (doc.description && doc.description.toLowerCase().includes(lowerCaseQuery)) ||
      (doc.tags && doc.tags.toLowerCase().includes(lowerCaseQuery)) ||
      (doc.originalFileName && doc.originalFileName.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredDocuments(filtered);
  }, [searchQuery, documents]);

  const handleReauthenticate = async () => {
    if (activePrimaryTab === 'my-documents' && authError) {
        setAuthError(false); 
        await handleLogin(); 
    } else {
        loadData(); 
    }
  };

  const navigateToFolder = async (folder: DisplayableDocument) => {
    if (!folder.isFolder || activePrimaryTab !== 'my-documents' || !folder.id) return; 
    setIsLoading(true);
    try {
      const folderContentsResult = await getFolderContents(folder.id);
      const mappedContents: DisplayableDocument[] = (folderContentsResult || []).map((item: any) => ({
        id: item.id, name: item.name, url: item.webUrl, lastModified: item.lastModifiedDateTime, 
        size: item.size, isFolder: !!item.folder, source: 'OneDrive', originalFileName: item.name,
      }));
      mappedContents.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1; if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      setDocuments(mappedContents);
      setCurrentPath(prevPath => [...prevPath, { id: folder.id!, name: folder.name }]);
      setSearchQuery('');
    } catch (error: any) {
      toast.error(`Failed to load folder contents: ${error.message}`);
      if (error.message?.includes('Authentication') || error.code === 'UserLoginRequired') setAuthError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateUp = async () => {
    if (currentPath.length === 0 || activePrimaryTab !== 'my-documents') return;
    setIsLoading(true);
    const newPath = [...currentPath]; newPath.pop();
    try {
      if (newPath.length === 0) {
        await fetchPersonalDocumentsRoot(); 
      } else {
        const parentFolder = newPath[newPath.length - 1];
        const folderContentsResult = await getFolderContents(parentFolder.id);
        const mappedContents: DisplayableDocument[] = (folderContentsResult || []).map((item: any) => ({
            id: item.id, name: item.name, url: item.webUrl, lastModified: item.lastModifiedDateTime,
            size: item.size, isFolder: !!item.folder, source: 'OneDrive', originalFileName: item.name,
        }));
        mappedContents.sort((a,b) => {
            if (a.isFolder && !b.isFolder) return -1; if (!a.isFolder && b.isFolder) return 1;
            return a.name.localeCompare(b.name);
        });
        setDocuments(mappedContents); 
        setCurrentPath(newPath);
        setSearchQuery('');
      }
    } catch (error: any) {
      toast.error(`Failed to load parent folder: ${error.message}`);
      if (error.message?.includes('Authentication') || error.code === 'UserLoginRequired') setAuthError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (doc: DisplayableDocument) => {
    const fileName = doc.source === 'SharePointLink' ? doc.originalFileName : doc.name;
    if (!fileName) return <FileText className="h-10 w-10 text-gray-400" />;
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'doc': case 'docx': return <FileText className="h-10 w-10 text-blue-500" />;
      case 'xls': case 'xlsx': return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
      case 'ppt': case 'pptx': return <Presentation className="h-10 w-10 text-red-500" />;
      case 'jpg': case 'jpeg': case 'png': case 'gif': return <FileImage className="h-10 w-10 text-purple-500" />;
      case 'pdf': return <File className="h-10 w-10 text-red-600" />;
      case 'zip': case 'rar': return <FileArchive className="h-10 w-10 text-yellow-500" />;
      case 'txt': case 'md': return <FileText className="h-10 w-10 text-gray-500" />;
      case 'js': case 'ts': case 'html': case 'css': return <FileCode className="h-10 w-10 text-indigo-500" />;
      case 'mp4': case 'mov': case 'avi': return <Video className="h-10 w-10 text-pink-500" />;
      case 'mp3': case 'wav': case 'aac': return <Music className="h-10 w-10 text-teal-500" />;
      default: return <FileText className="h-10 w-10 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (bytes === undefined || bytes === 0) return '0 B';
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handlePrimaryTabChange = (tabId: string) => {
    if (isUploading || isLoading) return;
    setActivePrimaryTab(tabId);
    const tabConfig = primaryTabsConfig.find(t => t.id === tabId);
    setActiveSecondaryNav(tabConfig?.defaultSecondary || secondaryNavConfig[tabId]?.[0]?.id || '');
    setExpandedCompanyWideItems({}); // Collapse all on primary tab change
  };

  const handleSecondaryNavChange = (navId: string, isParentToggle: boolean = false) => {
    if (isUploading || isLoading) return;
    
    const item = findCategoryById(navId, companyWideSubCategories);

    if (item && item.children && item.children.length > 0) { // It's a parent item
        setExpandedCompanyWideItems(prev => ({ ...prev, [navId]: !prev[navId] }));
        // If only toggling, don't change activeSecondaryNav unless it's explicitly set or no child is active
        // For now, clicking a parent always makes it active.
    }
    // Always set the clicked item (parent or child) as active
    setActiveSecondaryNav(navId);
  };
  

  const handleShareDocument = async (documentData: { title: string; description: string; tags?: string; file?: File | null; category: string; subCategory?: string | null; }) => {
    if (!documentData.file || !user) {
      toast.error(user ? 'No file selected.' : 'User not authenticated.'); return;
    }
    setIsUploading(true); toast.loading('Sharing document...');
    const sitePath = "/sites/scpngintranet"; const libraryName = "SCPNG Docuements";
    let targetFolderPath = '';
    if (documentData.category === 'SCPNG Shared Documents') {
        targetFolderPath = documentData.subCategory ? `SCPNG Shared Documents/${documentData.subCategory}` : 'SCPNG Shared Documents';
    } else if (documentData.category === 'Unit Shared') { // This now covers Division Shared
        targetFolderPath = 'Unit Shared'; // Or a more specific path like 'Division Shared' if your SP structure uses that name
    } else { targetFolderPath = 'Shared Documents'; } // Default/fallback
    
    console.log(`Upload to SP: sitePath='${sitePath}', library='${libraryName}', folder='${targetFolderPath || 'Root'}'`);
    try {
      const sharePointUrl = await uploadBinaryFileToSharePoint(
        documentData.file, documentData.file.name, sitePath, libraryName, targetFolderPath
      );
      if (!sharePointUrl) throw new Error('Upload to SharePoint failed. No URL returned.');
      toast.dismiss(); toast.success('Uploaded to SharePoint!'); toast.loading('Saving details...');
      const { error: supabaseError } = await supabase.from('company_documents').insert({
          title: documentData.title, description: documentData.description, tags: documentData.tags,
          sharepoint_url: sharePointUrl, file_name: documentData.file.name, file_type: documentData.file.type,
          file_size: documentData.file.size, shared_category: documentData.category, 
          sub_category: documentData.subCategory, uploader_user_id: user.id,
        });
      if (supabaseError) throw supabaseError;
      toast.dismiss(); toast.success('Document shared successfully!');
      setIsAddDocumentModalOpen(false);
      
      // Refresh logic
      let shouldReload = false;
      if (activePrimaryTab === 'company-wide' && documentData.category === 'SCPNG Shared Documents') {
        const activeNavItem = findCategoryById(activeSecondaryNav, companyWideSubCategories);
        if (activeSecondaryNav === 'all-company' || (activeNavItem?.dbSubCategoryValue === documentData.subCategory) || 
            (activeNavItem?.children?.some(c => c.dbSubCategoryValue === documentData.subCategory && expandedCompanyWideItems[activeNavItem.id])) ) {
            shouldReload = true;
        }
      } else if (activePrimaryTab === 'team-unit' && documentData.category === 'Unit Shared') {
        // If a document is uploaded to 'Unit Shared' (Division Shared), reload if current view is for it.
        if (activeSecondaryNav === 'team-all' || activeSecondaryNav === 'division-shared') {
            shouldReload = true;
        }
      }
      if (shouldReload) loadData();
    } catch (error: any) {
      console.error('Error sharing document:', error);
      toast.dismiss(); toast.error(`Failed to share document: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const currentPrimaryTabConfig = primaryTabsConfig.find(t => t.id === activePrimaryTab);
  const searchPlaceholder = currentPrimaryTabConfig ? `Search in ${currentPrimaryTabConfig.label}...` : 'Search documents...';

  const renderCompanyWideNav = (items: CompanyWideSubCategoryItem[], level = 0) => {
    return items.map(navItem => (
      <div key={navItem.id}>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleSecondaryNavChange(navItem.id)}
                disabled={isLoading || isUploading}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                            ${activeSecondaryNav === navItem.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                            ${level > 0 ? 'pl-9' : ''} group`}
              >
                {navItem.children && navItem.children.length > 0 && (
                  expandedCompanyWideItems[navItem.id] ? 
                  <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0 transform group-hover:text-foreground" /> : 
                  <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0 transform group-hover:text-foreground" />
                )}
                <span className="truncate flex-1 text-left">{navItem.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" align="start">
              <p>{navItem.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {navItem.children && expandedCompanyWideItems[navItem.id] && (
          <div className="mt-1 space-y-1">
            {renderCompanyWideNav(navItem.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };


  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Document Management System</h1>
        <p className="text-gray-500">Access and manage company and personal documents</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <Input
          placeholder={searchPlaceholder} value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-[400px]" disabled={isUploading || isLoading}
        />
        <div className="flex items-center gap-2">
            <Button onClick={loadData} variant="outline" disabled={isUploading || isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            {/* Show Add Document button if not on 'My Documents' or 'External Shared' tab */}
            {activePrimaryTab !== 'my-documents' && activePrimaryTab !== 'external-shared' && (
                 <Button onClick={() => setIsAddDocumentModalOpen(true)} variant="default" disabled={isUploading || isLoading}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Document
                </Button>
            )}
        </div>
      </div>

      <nav className="mb-6 border-b border-gray-300">
        <ul className="flex flex-wrap -mb-px">
          {primaryTabsConfig.map(tab => (
            <li key={tab.id} className="mr-2">
              <button
                onClick={() => handlePrimaryTabChange(tab.id)}
                disabled={isLoading || isUploading}
                className={`inline-flex items-center justify-center p-4 border-b-2 group
                            ${activePrimaryTab === tab.id 
                                ? 'border-primary text-primary font-semibold' 
                                : 'border-transparent hover:text-gray-600 hover:border-gray-300 text-gray-500'}`}
              > {tab.icon} {tab.label} </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {(secondaryNavConfig[activePrimaryTab] || []).length > 0 && (
          <aside className="w-full md:w-72 flex-shrink-0 bg-background md:border-r md:border-gray-200 md:pr-4"> {/* Increased width slightly */}
            <nav className="space-y-1">
              {activePrimaryTab === 'company-wide' ? (
                renderCompanyWideNav(companyWideSubCategories)
              ) : (
                (secondaryNavConfig[activePrimaryTab] || []).map(navItem => (
                  <TooltipProvider key={navItem.id} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSecondaryNavChange(navItem.id)}
                          disabled={isLoading || isUploading}
                          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                                      ${activeSecondaryNav === navItem.id 
                                          ? 'bg-primary text-primary-foreground' 
                                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                          <span className="truncate flex-1 text-left">{navItem.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="start">
                        <p>{navItem.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              )}
            </nav>
          </aside>
        )}

        <div className="flex-grow min-w-0">
          {isLoading && (
             <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="ml-4 text-lg text-muted-foreground">Loading Documents...</p>
            </div>
          )}

          {!isLoading && authError && activePrimaryTab === 'my-documents' && (
            <div className="flex flex-col items-center justify-center p-8 bg-destructive/10 rounded-lg mt-4">
              <p className="text-destructive mb-4 text-center">Authentication error for My Documents. Please re-authenticate.</p>
              <Button onClick={handleReauthenticate} variant="default" disabled={isLoading || isUploading}>
                Re-authenticate
              </Button>
            </div>
          )}

          {!isLoading && !authError && activePrimaryTab === 'my-documents' && currentPath.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
              <Button variant="ghost" size="sm" onClick={navigateUp} disabled={isLoading || isUploading} className="flex items-center text-primary hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button> <span>/</span>
              <Button variant="link" size="sm" className="text-primary px-1 h-auto py-0" 
                 onClick={async () => { setIsLoading(true); await fetchPersonalDocumentsRoot(); setIsLoading(false);}}
                 disabled={isLoading || isUploading}> OneDrive Root </Button> <span>/</span>
              {currentPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-1">
                  {index < currentPath.length - 1 ? (
                    <Button variant="link" size="sm" className="text-primary px-1 h-auto py-0"
                      onClick={async () => {
                        if(isLoading || isUploading) return; setIsLoading(true);
                        const pathSlice = currentPath.slice(0, index + 1);
                        const targetFolder = pathSlice[pathSlice.length - 1];
                        try {
                          const contentsResult = await getFolderContents(targetFolder.id);
                          const contents : DisplayableDocument[] = (contentsResult || []).map((item:any) => ({
                            id: item.id, name: item.name, url: item.webUrl, lastModified: item.lastModifiedDateTime, size: item.size, isFolder: !!item.folder, source: 'OneDrive', originalFileName: item.name
                          }));
                          contents.sort((a,b) => { if(a.isFolder && !b.isFolder) return -1; if(!a.isFolder && b.isFolder) return 1; return a.name.localeCompare(b.name);});
                          setDocuments(contents); setCurrentPath(pathSlice); 
                        } catch(error: any) {
                           toast.error(`Failed to load folder: ${error.message}`);
                           if (error.message?.includes('Authentication') || error.code === 'UserLoginRequired') setAuthError(true);
                        } finally { setIsLoading(false); }
                      }}
                      disabled={isLoading || isUploading} > {folder.name} </Button>
                  ) : ( <span className="text-foreground font-medium px-1">{folder.name}</span> )}
                  {index < currentPath.length - 1 && <span className="text-gray-400">/</span>}
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!authError || activePrimaryTab !== 'my-documents') && (
            filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div key={doc.id}
                  className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col border border-border overflow-hidden"
                  onClick={() => doc.isFolder && activePrimaryTab === 'my-documents' ? navigateToFolder(doc) : window.open(doc.url, '_blank')}
                  role="button" tabIndex={0}
                  onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') { doc.isFolder && activePrimaryTab === 'my-documents' ? navigateToFolder(doc) : window.open(doc.url, '_blank'); }}} >
                  <div className="p-5">
                    <div className="flex items-start mb-3">
                      <div className="mr-4 flex-shrink-0 pt-0.5">
                          {doc.isFolder && activePrimaryTab === 'my-documents' ? <Folder className="h-10 w-10 text-yellow-500" /> : getFileIcon(doc)}
                      </div>
                      <div className="flex-1 min-w-0"> <h3 className="font-semibold text-base text-card-foreground truncate" title={doc.name}>{doc.name}</h3> </div>
                    </div>
                    {doc.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2" title={doc.description}> {doc.description} </p> }
                    <div className="text-xs text-muted-foreground mb-3">
                      {!doc.isFolder || activePrimaryTab !== 'my-documents' ? ( <> <span>{formatFileSize(doc.size)}</span> <span className="mx-1.5">•</span> <span>{formatDate(doc.lastModified)}</span> </> ) 
                                                                         : ( <span className="italic">Folder</span> )}
                    </div>
                    {doc.tags && (
                      <div className="mt-auto pt-2 border-t border-border/60">
                        <p className="text-xs text-muted-foreground mb-1">Tags:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {doc.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium"> {tag} </span>
                          ))} </div> </div> )}
                  </div> </div>
              ))}
            </div>
          ) : (
             <div className="col-span-full text-center py-10 text-gray-500">
              <p className="text-lg mb-2"> {searchQuery ? 'No documents match your search.' : 'No documents found.'} </p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term.' : 
                    (activePrimaryTab === 'my-documents' ? 'You have no documents in this OneDrive folder.' : 
                     activePrimaryTab === 'company-wide' ? 'No company documents found in this category.' :
                     activePrimaryTab === 'team-unit' ? 'No documents found for your team/unit.' :
                     'Check back later for new documents.')}
              </p>
            </div>
          ))}

        </div>
      </div>

      <AddDocumentModal 
        isOpen={isAddDocumentModalOpen}
        onClose={() => setIsAddDocumentModalOpen(false)}
        onShare={handleShareDocument}
        isUploading={isUploading}
        shareableCategories={currentSharePointCategoriesForModal}
        subCategories={currentSubCategoriesForModal}
        initialCategory={currentSharePointCategoriesForModal[0]}
        initialSubCategory={newIdToOldLabelMap[activeSecondaryNav]}
      />
    </PageLayout>
  );
}
