import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, Plus, Edit, Trash2, List, LayoutGrid, Search, Download, 
  RotateCcw, Rows, MoreVertical, Info
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { logger } from '@/lib/supabaseClient'; // Keep logger if used elsewhere
import { supabase } from '@/lib/supabaseClient'; // Add import for supabase client
import { useAssetsData } from '@/hooks/useSupabaseData';
import { useMsal } from '@azure/msal-react'; // <--- Import useMsal from msal-react
import { InteractionStatus } from '@azure/msal-browser'; // Import InteractionStatus if needed for loading
import { UserAsset } from '@/types';
import { divisions } from '@/data/divisions'; // Import divisions data
import { units } from '@/data/units'; // Import units data
import { staffMembers } from '@/data/divisions'; // Import staffMembers data
import { formatDate } from '@/lib/utils'; // Import formatDate from utils
import { cn } from '@/lib/utils'; // Import cn utility

// Import modal components
import AddAssetModal from '@/components/unit-tabs/modals/AddAssetModal';
import EditAssetModal from '@/components/unit-tabs/modals/EditAssetModal';
import DeleteModal from '@/components/unit-tabs/modals/DeleteModal';
import AssetCard from '@/components/assets/AssetCard';
import HighlightMatch from '@/components/ui/HighlightMatch';
import AssetInfoModal from '@/components/assets/AssetInfoModal';

// --- Add dropdown components ---
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// --- End dropdown components ---

// --- Pagination Component (Optional, but good practice) ---
// import PaginationControls from '@/components/ui/PaginationControls'; // Removed import as component doesn't exist yet
// --- End Pagination Component ---

const ITEMS_PER_PAGE = 15; // Define items per page constant

const AssetManagement = () => {
  const { instance, accounts, inProgress } = useMsal(); // <-- Use MSAL hook
  const account = useMemo(() => accounts[0], [accounts]); // Get the first (active) account
  const authLoading = useMemo(() => inProgress !== InteractionStatus.None, [inProgress]); // Determine loading state
  
  const { toast } = useToast();

  // Use the asset data hook
  const { 
    data: assets, 
    loading: assetsLoading, 
    error: assetsError, 
    add: addAsset, 
    update: editAsset, 
    remove: deleteAsset, 
  } = useAssetsData();

  // State for managing modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<UserAsset | null>(null);
  
  // --- State for Info Modals ---
  const [selectedAssetForInfo, setSelectedAssetForInfo] = useState<UserAsset | null>(null); // Renamed from infoModalAsset
  const [isQuickInfoModalOpen, setIsQuickInfoModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'table' | 'card' | 'detailed-list'>('table');
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  // --- End Pagination State ---

  // --- Derive unique lists for modal suggestions --- 
  const existingNames = useMemo(() => 
    Array.from(new Set(assets.map(a => a.name).filter(Boolean) as string[])).sort(), 
    [assets]
  );
  const existingTypes = useMemo(() => 
    Array.from(new Set(assets.map(a => a.type).filter(Boolean) as string[])).sort(), 
    [assets]
  );
  const existingVendors = useMemo(() => 
    Array.from(new Set(assets.map(a => a.vendor).filter(Boolean) as string[])).sort(), 
    [assets]
  );

  // --- Derive user name for filtering directly from MSAL account ---
  // This is now mainly used for display or potentially for the 'add' action
  const userNameForFiltering = useMemo(() => account?.name || null, [account]);

  // Log the user object and the raw assets array from the hook
  console.log('[AssetManagement] MSAL Account object:', account);
  console.log('[AssetManagement] User Name (for display/add):', userNameForFiltering); 
  console.log('[AssetManagement] Assets array (already filtered by hook):', assets);

  // --- Filtering Logic (Client-side) --- 
  // [Cursor] Updated filtering logic to include all filters
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
        const searchTerm = filterText.toLowerCase();
        
        // Text search check
        const textMatch = !searchTerm || (
          (asset.name && asset.name.toLowerCase().includes(searchTerm)) ||
          (asset.id && asset.id.toLowerCase().includes(searchTerm)) ||
          (asset.type && asset.type.toLowerCase().includes(searchTerm)) ||
          (asset.condition && asset.condition.toLowerCase().includes(searchTerm)) ||
          (asset.vendor && asset.vendor.toLowerCase().includes(searchTerm)) ||
          (asset.unit && asset.unit.toLowerCase().includes(searchTerm)) ||
          (asset.division && asset.division.toLowerCase().includes(searchTerm)) ||
          (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchTerm)) ||
          (asset.notes && asset.notes.toLowerCase().includes(searchTerm)) ||
          (asset.description && asset.description.toLowerCase().includes(searchTerm))
        );

        // Dropdown filter checks
        const typeMatch = filterType === 'all' || (asset.type && asset.type === filterType);
        const conditionMatch = filterCondition === 'all' || (asset.condition && asset.condition === filterCondition);
        const unitMatch = filterUnit === 'all' || (asset.unit && asset.unit === filterUnit);
        const divisionMatch = filterDivision === 'all' || (asset.division && asset.division === filterDivision);
        const vendorMatch = filterVendor === 'all' || (asset.vendor && asset.vendor === filterVendor);

        return textMatch && typeMatch && conditionMatch && unitMatch && divisionMatch && vendorMatch;
      });
  }, [assets, filterText, filterType, filterCondition, filterUnit, filterDivision, filterVendor]); // [Cursor] Update dependencies

  console.log(`[AssetManagement] Filters: Text="${filterText}", Type="${filterType}", Condition="${filterCondition}", Unit="${filterUnit}", Division="${filterDivision}", Vendor="${filterVendor}"`);
  console.log('[AssetManagement] Assets array AFTER filtering:', filteredAssets);
  // --- End Filtering Logic ---

  // --- Pagination Logic ---
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  }, [filteredAssets]);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAssets.slice(startIndex, endIndex);
  }, [filteredAssets, currentPage]);

  // Reset to page 1 when filters or source data change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterType, filterCondition, filterUnit, filterDivision, filterVendor, assets]); // Reset on filter or data change
  // --- End Pagination Logic ---

  // --- Email for filtering (derive from MSAL account) ---
  // Ensure 'account.username' holds the email address
  const loggedInUserEmail = useMemo(() => account?.username || null, [account]);
  // --- End Email for filtering ---

  // --- Modal Handlers ---

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleEditClick = (asset: UserAsset) => {
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (asset: UserAsset) => {
    setSelectedAsset(asset);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedAsset(null);
    // --- Close both info modals and clear selected asset ---
    setSelectedAssetForInfo(null);
    setIsQuickInfoModalOpen(false);
    // --- End closing info modals ---
  };

  // [Cursor] Handler to open the QUICK info modal
  const handleInfoClick = (asset: UserAsset) => {
    setSelectedAssetForInfo(asset);
    setIsQuickInfoModalOpen(true);
  };

  // [Cursor] Handler to reset all filters
  const handleResetFilters = () => {
    setFilterText('');
    setFilterType('all');
    setFilterCondition('all');
    setFilterUnit('all');
    setFilterDivision('all');
    setFilterVendor('all');
  };

  // --- Data Operation Handlers ---

  const handleSaveAdd = async (newAssetData: Partial<Omit<UserAsset, 'id' | 'created_at' | 'last_updated'>>) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Use assignee details from modal if provided, otherwise default (though validation should prevent this)
    const completeAssetData = {
      ...newAssetData,
      assigned_to: newAssetData.assigned_to || userNameForFiltering, // Use name from modal
      assigned_to_email: newAssetData.assigned_to_email || loggedInUserEmail, // Use email from modal
      assigned_date: newAssetData.assigned_date || today, // Keep defaulting assigned_date
    } as Omit<UserAsset, 'id' | 'created_at' | 'last_updated'>;
    
    // Validation should now happen inside the modal, but keep a basic check here
    if (!completeAssetData.name || !completeAssetData.assigned_to) {
      toast({ title: "Error", description: "Asset name and Assigned To are required.", variant: "destructive" });
      return;
    }
    // Removed redundant check for assigned_to determination

    // --- Exclude 'specifications' before sending to Supabase ---
    const { specifications, ...dataToSend } = completeAssetData;
    // --- End exclusion ---

    try {
      // Pass the object without 'specifications'
      await addAsset(dataToSend as any); 
      toast({ title: "Asset Added", description: "New asset has been added successfully." });
      handleCloseModals();
    } catch (err) {
      logger.error("Error adding asset:", err);
      toast({ title: "Error Adding Asset", description: err instanceof Error ? err.message : "Could not add asset.", variant: "destructive" });
    }
  };

  const handleSaveEdit = async (updatedAssetData: Partial<UserAsset>) => {
    if (!selectedAsset) return;
    try {
      const dataToSave = loggedInUserEmail ? { ...updatedAssetData, last_updated_by: loggedInUserEmail } : updatedAssetData;
      await editAsset(selectedAsset.id, dataToSave);
      toast({ title: "Asset Updated", description: "Asset details have been updated." });
      handleCloseModals();
    } catch (err) {
      logger.error("Error updating asset:", err);
      toast({ title: "Error Updating Asset", description: err instanceof Error ? err.message : "Could not update asset.", variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAsset) return;
    try {
      await deleteAsset(selectedAsset.id);
      toast({ title: "Asset Deleted", description: "Asset has been removed successfully." });
      handleCloseModals();
    } catch (err) {
      logger.error("Error deleting asset:", err);
      toast({ title: "Error Deleting Asset", description: err instanceof Error ? err.message : "Could not delete asset.", variant: "destructive" });
    }
  };

  // Use authLoading derived from useMsal
  if (authLoading) {
    return (
        <PageLayout>
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Initializing Authentication...</span>
            </div>
        </PageLayout>
    );
  }

  // Handle case where MSAL account is not available after loading
  if (!authLoading && !account) {
     return (
        <PageLayout>
            <div className="text-center py-10 px-4 text-destructive">
              <p>User not authenticated. Please log in.</p>
              {/* Optionally add a login button here */}
            </div>
        </PageLayout>
    );
  }

  // --- If user is authenticated but no email, show error (or handle differently) ---
  if (!authLoading && !loggedInUserEmail) {
    return (
        <PageLayout>
            <div className="text-center py-10 px-4 text-destructive">
              <p>Could not determine your user email. Please ensure your profile is complete or contact support.</p>
            </div>
        </PageLayout>
    );
  }
  // --- End User Email Check ---

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header and Actions - Search on left, buttons on right */}
        <div className="flex justify-between items-center gap-4"> {/* Updated classes */}
          {/* Search Input - Moved here */}
          <div className="relative w-full max-w-sm"> {/* Adjusted width */}
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Filter by name, type, vendor..." 
              value={filterText} 
              onChange={(e) => setFilterText(e.target.value)} 
              className="pl-8 w-full"
            />
          </div>
          {/* Action Buttons Container */}
          <div className="flex items-center gap-2 flex-shrink-0"> {/* Added flex-shrink-0 */} 
            {/* View Mode Toggle */}
            <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as 'table' | 'card' | 'detailed-list')} 
                aria-label="View mode"
                className="border rounded-md p-0.5"
            >
                <ToggleGroupItem value="table" aria-label="Table view" className="px-2 py-1 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="card" aria-label="Card view" className="px-2 py-1 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                 <ToggleGroupItem value="detailed-list" aria-label="Detailed list view" className="px-2 py-1 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <Rows className="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
            {/* Add Asset Button */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddClick}>
                  <Plus className="mr-2 h-4 w-4" /> Add Asset
                </Button>
              </DialogTrigger>
              {isAddModalOpen && (
                <AddAssetModal 
                    isOpen={isAddModalOpen} 
                    onClose={handleCloseModals} 
                    onAdd={handleSaveAdd} 
                    divisions={divisions} 
                    units={units} 
                    staffMembers={staffMembers} 
                    existingNames={existingNames}
                    existingTypes={existingTypes}
                    existingVendors={existingVendors}
                />
              )}
            </Dialog>
             {/* More Options Dropdown */}
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                {/* Add more options here if needed */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters Section - Improved Responsiveness (Search bar removed from here) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-center"> {/* Adjusted grid columns */} 
          {/* Filter Selects - Each takes one column */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {[...new Set(assets.map(a => a.type).filter(Boolean))].sort().map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {[...new Set(assets.map(a => a.condition).filter(Boolean))].sort().map(cond => <SelectItem key={cond} value={cond}>{cond}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterUnit} onValueChange={setFilterUnit}>
             <SelectTrigger className="w-full">
              <SelectValue placeholder="All Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {[...new Set(assets.map(a => a.unit).filter(Boolean))].sort().map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDivision} onValueChange={setFilterDivision}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">All Divisions</SelectItem>
              {[...new Set(assets.map(a => a.division).filter(Boolean))].sort().map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}
            </SelectContent>
          </Select>
           <Select value={filterVendor} onValueChange={setFilterVendor}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">All Vendors</SelectItem>
              {[...new Set(assets.map(a => a.vendor).filter(Boolean))].sort().map(vendor => <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Reset Button - Positioned at the end */}
          <Button 
            variant="ghost" 
            onClick={handleResetFilters} 
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground justify-self-start xl:justify-self-end"
            > 
             <RotateCcw className="h-4 w-4" />
             Reset
          </Button>
        </div>

        {/* Main Content Area */}
        <Card> 
          <CardContent className="p-0 overflow-auto relative h-[70vh]"> {/* Changed classes */}
            {assetsLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
                <span className="ml-2 text-muted-foreground">Loading assets...</span>
              </div>
            )}
            {assetsError && (
              <div className="text-center py-10 px-4 text-destructive flex items-center justify-center h-full">
                <p>Error loading assets: {assetsError.message}</p>
              </div>
            )}
            {!assetsLoading && !assetsError && (
              <>
                {/* Table View - Replaced with HTML structure matching example */} 
                {viewMode === 'table' && (
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-20">
                      <tr>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 w-[60px]">Img</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[200px]">Name</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 w-[50px]">ID</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[150px]">Type</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[100px]">Condition</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[150px]">Assigned To</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[200px]">Email</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[150px]">Unit</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[200px]">Division</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[200px]">Description</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[150px]">Assigned Date</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[150px]">Purchased Date</th>
                        <th scope="col" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 min-w-[150px]">Last Updated</th>
                        <th scope="col" className="sticky right-0 px-4 py-2 bg-gray-100 dark:bg-gray-700 w-[100px] text-right z-30">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAssets.length > 0 ? (
                        paginatedAssets.map(asset => (
                          <tr key={asset.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                             {/* Image Cell */}
                            <td className="px-4 py-2 cursor-pointer" onClick={() => handleInfoClick(asset)}>
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={asset.image_url || undefined} alt={asset.name} />
                                <AvatarFallback>{asset.name?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            </td>
                             {/* Name Cell (using td, adjust if th is preferred) */}
                            <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white cursor-pointer" onClick={() => handleInfoClick(asset)}>
                              <HighlightMatch text={asset.name || 'N/A'} searchTerm={filterText} />
                            </td>
                             {/* Other data cells */}
                             <td className="px-4 py-2"><HighlightMatch text={asset.id || 'N/A'} searchTerm={filterText} /></td>
                            <td className="px-4 py-2"><HighlightMatch text={asset.type || 'N/A'} searchTerm={filterText} /></td>
                            <td className="px-4 py-2"><HighlightMatch text={asset.condition || 'N/A'} searchTerm={filterText} /></td>
                            <td className="px-4 py-2"><HighlightMatch text={asset.assigned_to || 'N/A'} searchTerm={filterText} /></td>
                            <td className="px-4 py-2"><HighlightMatch text={asset.assigned_to_email || 'N/A'} searchTerm={filterText} /></td>
                            <td className="px-4 py-2"><HighlightMatch text={asset.unit || 'N/A'} searchTerm={filterText} /></td>
                            <td className="px-4 py-2"><HighlightMatch text={asset.division || 'N/A'} searchTerm={filterText} /></td>
                            <td className="px-4 py-2 max-w-xs truncate" title={asset.description || undefined}><HighlightMatch text={asset.description || 'N/A'} searchTerm={filterText} /></td>
                            <td className="px-4 py-2">{formatDate(asset.assigned_date)}</td>
                            <td className="px-4 py-2">{formatDate(asset.purchase_date)}</td>
                            <td className="px-4 py-2">{formatDate(asset.last_updated)}</td>
                            {/* Actions Cell - sticky right */}
                            <td className="sticky right-0 px-4 py-2 bg-white dark:bg-gray-800 text-right z-10"> {/* Added background matching row */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleInfoClick(asset)}>
                                    <Info className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditClick(asset)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteClick(asset)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={14} className="h-24 text-center text-gray-500 dark:text-gray-400"> {/* Adjusted colSpan */}
                            {filterText || filterType !== 'all' || filterCondition !== 'all' || filterUnit !== 'all' || filterDivision !== 'all' || filterVendor !== 'all'
                              ? `No assets found matching the current filters.`
                              : "No assets were found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
                {/* End Table View */} 

                {/* Card View */} 
                {viewMode === 'card' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"> {/* Keep padding for card view */}
                    {paginatedAssets.length > 0 ? (
                       paginatedAssets.map(asset => (
                        <AssetCard 
                          key={asset.id} 
                          asset={asset} 
                          onClick={() => handleInfoClick(asset)} 
                          onEdit={() => handleEditClick(asset)} 
                          onDelete={() => handleDeleteClick(asset)} 
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-10 px-4 text-muted-foreground">
                         {filterText || filterType !== 'all' || filterCondition !== 'all' || filterUnit !== 'all' || filterDivision !== 'all' || filterVendor !== 'all'
                            ? `No assets found matching the current filters.`
                            : "No assets were found."}
                      </div>
                    )}
                  </div>
                )}
                {/* End Card View */} 
                
                {/* Detailed List View */} 
                 {viewMode === 'detailed-list' && (
                  <Table className="min-w-max text-xs"> 
                    <TableHeader>
                      <TableRow>
                         <TableHead className="sticky left-0 bg-background z-10 w-[50px] h-auto py-1 px-2">Img</TableHead>
                        <TableHead className="sticky left-[50px] bg-background z-10 min-w-[150px] h-auto py-1 px-2">Name</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">ID</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Type</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Condition</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Assigned To</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Email</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Unit</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Division</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Description</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Assigned Date</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Purchase Date</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Purchase Cost</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Vendor</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Warranty Expiry</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Expiry Date</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Life Exp (Yrs)</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Depreciated Value</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">YTD Usage</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Notes</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Last Updated</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Updated By</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Created At</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Admin Comments</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Invoice URL</TableHead>
                        <TableHead className="sticky top-0 h-auto py-1 px-2 bg-background">Barcode URL</TableHead>
                        <TableHead className="sticky right-0 bg-background z-30 text-right min-w-[100px] h-auto py-1 px-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {paginatedAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={27} className="h-16 text-center text-muted-foreground py-1 px-2">
                             {filterText || filterType !== 'all' || filterCondition !== 'all' || filterUnit !== 'all' || filterDivision !== 'all' || filterVendor !== 'all'
                              ? `No assets found matching the current filters.`
                              : "No assets were found."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedAssets.map((asset) => (
                          <TableRow key={asset.id} className="h-auto">
                            <TableCell className="sticky left-0 bg-background z-10 py-1 px-2 cursor-pointer" onClick={() => handleInfoClick(asset)}>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={asset.image_url || undefined} alt={asset.name} />
                                <AvatarFallback>{asset.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="sticky left-[50px] bg-background z-10 font-medium py-1 px-2 cursor-pointer" onClick={() => handleInfoClick(asset)}>
                                <HighlightMatch text={asset.name} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2">
                                <HighlightMatch text={asset.id} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2">
                                <HighlightMatch text={asset.type} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2">
                                <HighlightMatch text={asset.condition} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2">
                                <HighlightMatch text={asset.assigned_to} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2">{asset.assigned_to_email || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2">
                                <HighlightMatch text={asset.unit} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2">
                                <HighlightMatch text={asset.division} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.description || undefined}>
                                <HighlightMatch text={asset.description || 'N/A'} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2">{formatDate(asset.assigned_date)}</TableCell>
                            <TableCell className="py-1 px-2">{formatDate(asset.purchase_date)}</TableCell>
                            <TableCell className="py-1 px-2">{asset.purchase_cost != null ? `$${asset.purchase_cost.toFixed(2)}` : 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2">
                                <HighlightMatch text={asset.vendor} searchTerm={filterText} />
                            </TableCell>
                            <TableCell className="py-1 px-2">{formatDate(asset.warranty_expiry_date)}</TableCell>
                            <TableCell className="py-1 px-2">{formatDate(asset.expiry_date)}</TableCell>
                            <TableCell className="py-1 px-2">{asset.life_expectancy_years ?? 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2">{asset.depreciated_value != null ? `$${asset.depreciated_value.toFixed(2)}` : 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2">{asset.ytd_usage || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.notes || undefined}>{asset.notes || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2">{formatDate(asset.last_updated)}</TableCell>
                            <TableCell className="py-1 px-2">{asset.last_updated_by || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2">{formatDate(asset.created_at)}</TableCell>
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.admin_comments || undefined}>{asset.admin_comments || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.invoice_url || undefined}>{asset.invoice_url || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.barcode_url || undefined}>{asset.barcode_url || 'N/A'}</TableCell>
                            <TableCell className="sticky right-0 bg-background z-10 text-right py-1 px-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => handleInfoClick(asset)}>
                                     <Info className="mr-2 h-4 w-4" />
                                     View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditClick(asset)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteClick(asset)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
                {/* End Detailed List View */} 
              </> /* Closing Fragment for !loading && !error */
            )}
            {/* Pagination Controls (Now directly inside CardContent, after the conditional content) */}
             {!assetsLoading && !assetsError && totalPages > 1 && (
                <div className="sticky bottom-0 bg-background flex items-center justify-between border-t p-4 flex-shrink-0 z-40"> {/* Made pagination sticky */}
                     <span className="text-sm text-muted-foreground">
                        Showing {paginatedAssets.length} of {filteredAssets.length} assets
                     </span>
                     <div className="flex items-center gap-2">
                         <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                             disabled={currentPage === 1}
                         >
                             Previous
                         </Button>
                         <span className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                         </span>
                         <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                             disabled={currentPage === totalPages}
                         >
                             Next
                         </Button>
                     </div>
                  </div>
              )}
          </CardContent>
        </Card>

        {/* Modals */}
        {isEditModalOpen && selectedAsset && (
          <EditAssetModal
            isOpen={isEditModalOpen} 
            onClose={handleCloseModals} 
            onEdit={handleSaveEdit}
            asset={selectedAsset}
            onDelete={() => handleDeleteClick(selectedAsset)}
            divisions={divisions}
            units={units}
            staffMembers={staffMembers}
            existingNames={existingNames}
            existingTypes={existingTypes}
            existingVendors={existingVendors}
          />
        )}

        {selectedAsset && isDeleteModalOpen && (
          <DeleteModal 
            open={isDeleteModalOpen} 
            onOpenChange={setIsDeleteModalOpen} 
            onDelete={handleConfirmDelete}
            title="Delete Asset"
            description={`Are you sure you want to delete the asset "${selectedAsset?.name || "this asset"}"? This action cannot be undone.`}
          />
        )}

        {/* --- Render Quick Asset Info Modal --- */}
        <AssetInfoModal 
          asset={selectedAssetForInfo} 
          isOpen={isQuickInfoModalOpen} 
          onClose={() => { // Only close the quick modal here
              setIsQuickInfoModalOpen(false); 
              // Optionally clear selectedAssetForInfo if you don't want the full modal to open after closing quick view directly
              // setSelectedAssetForInfo(null); 
          }} 
        />
        {/* --- End Quick Asset Info Modal --- */}
      </div>
    </PageLayout>
  );
};

export default AssetManagement; 