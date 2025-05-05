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
  RotateCcw, Rows, MoreVertical
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

const DecommissionedAssets = () => {
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
  const [infoModalAsset, setInfoModalAsset] = useState<UserAsset | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'detailed-list'>('table');
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCondition, setFilterCondition] = useState('Decommissioned');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');

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
  console.log('[DecommissionedAssets] MSAL Account object:', account);
  console.log('[DecommissionedAssets] User Name (for display/add):', userNameForFiltering); 
  console.log('[DecommissionedAssets] Assets array (already filtered by hook):', assets);

  // --- Filtering Logic (Client-side) --- 
  // [Cursor] Updated filtering logic to include all filters
  const filteredAssets = useMemo(() => {
    // Ensure the asset is decommissioned first
    const decommissioned = assets.filter(asset => asset.condition === 'Decommissioned');
    
    return decommissioned.filter(asset => {
      const searchTerm = filterText.toLowerCase();
      
      // Text search check (excluding condition)
      const textMatch = !searchTerm || (
        (asset.name && asset.name.toLowerCase().includes(searchTerm)) ||
        (asset.id && asset.id.toLowerCase().includes(searchTerm)) || // Use id
        (asset.type && asset.type.toLowerCase().includes(searchTerm)) ||
        // Skip condition check here as it's pre-filtered
        (asset.vendor && asset.vendor.toLowerCase().includes(searchTerm)) ||
        (asset.unit && asset.unit.toLowerCase().includes(searchTerm)) ||
        (asset.division && asset.division.toLowerCase().includes(searchTerm)) ||
        (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchTerm)) ||
        // (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm)) || // Remove serial_number
        (asset.notes && asset.notes.toLowerCase().includes(searchTerm)) ||
        (asset.description && asset.description.toLowerCase().includes(searchTerm))
      );

      // Dropdown filter checks (excluding condition)
      const typeMatch = filterType === 'all' || (asset.type && asset.type === filterType);
      const unitMatch = filterUnit === 'all' || (asset.unit && asset.unit === filterUnit);
      const divisionMatch = filterDivision === 'all' || (asset.division && asset.division === filterDivision);
      const vendorMatch = filterVendor === 'all' || (asset.vendor && asset.vendor === filterVendor);

      return textMatch && typeMatch && unitMatch && divisionMatch && vendorMatch;
    });
  }, [assets, filterText, filterType, filterUnit, filterDivision, filterVendor]); // Removed filterCondition

  console.log(`[DecommissionedAssets] Filters: Text="${filterText}", Type="${filterType}", Condition="${filterCondition}", Unit="${filterUnit}", Division="${filterDivision}", Vendor="${filterVendor}"`);
  console.log('[DecommissionedAssets] Assets array AFTER text filtering:', filteredAssets);
  // --- End Filtering Logic ---

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
    setInfoModalAsset(null);
  };

  // [Cursor] Handler to open the info modal
  const handleInfoClick = (asset: UserAsset) => {
    setInfoModalAsset(asset);
  };

  // [Cursor] Handler to reset all filters
  const handleResetFilters = () => {
    setFilterText('');
    setFilterType('all');
    setFilterCondition('Decommissioned');
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

    try {
      await addAsset(completeAssetData as any); 
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

  // Updated formatDate to handle timestamps better
  const formatDate = (dateInput: Date | string | null | undefined, includeTime = false) => {
    if (!dateInput) return 'N/A';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return 'Invalid Date'; // Check if date is valid
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      };
      if (includeTime) {
        options.hour = 'numeric';
        options.minute = 'numeric';
        // options.second = 'numeric'; // Optional: include seconds
      }
      return date.toLocaleString(undefined, options);
    } catch (e) {
      console.error("Error formatting date:", dateInput, e); // Log error
      return 'Invalid Date';
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

  return (
    <PageLayout>
      {/* --- Row 1: Title/Subtitle and Add Button --- */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Decommissioned Assets</h1>
          <p className="text-muted-foreground">View assets marked as decommissioned, damaged, or pending disposal.</p>
        </div>
        {/* <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" /> Add Asset
            </Button>
          </DialogTrigger>
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
        </Dialog> */}
      </div>

      {/* --- Row 2: Filters, Search, View, Export --- */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Filters */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            {['all', ...new Set(assets.map(a => a.type).filter(Boolean))].map(type => <SelectItem key={type} value={type}>{type === 'all' ? 'All Types' : type}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter by Condition" />
          </SelectTrigger>
          <SelectContent>
            {['all', ...new Set(assets.map(a => a.condition).filter(Boolean))].map(cond => <SelectItem key={cond} value={cond}>{cond === 'all' ? 'All Conditions' : cond}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter by Unit" />
          </SelectTrigger>
          <SelectContent>
            {['all', ...new Set(assets.map(a => a.unit).filter(Boolean))].map(unit => <SelectItem key={unit} value={unit}>{unit === 'all' ? 'All Units' : unit}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDivision} onValueChange={setFilterDivision}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Division" />
          </SelectTrigger>
          <SelectContent>
            {['all', ...new Set(assets.map(a => a.division).filter(Boolean))].map(div => <SelectItem key={div} value={div}>{div === 'all' ? 'All Divisions' : div}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterVendor} onValueChange={setFilterVendor}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Vendor" />
          </SelectTrigger>
          <SelectContent>
            {['all', ...new Set(assets.map(a => a.vendor).filter(Boolean))].map(vendor => <SelectItem key={vendor} value={vendor}>{vendor === 'all' ? 'All Vendors' : vendor}</SelectItem>)}
          </SelectContent>
        </Select>
        
        {/* Reset Button */}
        <Button 
          variant="ghost" 
          onClick={handleResetFilters}
          className="text-muted-foreground hover:text-foreground"
          title="Reset Filters"
        >
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>

        {/* Search Input */}
        <div className="relative flex-grow md:flex-grow-0 md:w-64"> {/* Adjusted width and growth */}
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text"
            placeholder="Filter by name, type, vendor..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        {/* Spacer */}
        <div className="flex-grow hidden md:block"></div> {/* Added spacer for large screens */}

        {/* View Toggle */}
        <ToggleGroup 
          type="single" 
          defaultValue="table" 
          value={viewMode}
          onValueChange={(value) => { if (value) setViewMode(value as 'table' | 'card' | 'detailed-list'); }}
          aria-label="View mode"
        >
          <ToggleGroupItem value="detailed-list" aria-label="Detailed list view">
            <List className="h-4 w-4" /> 
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <Rows className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="card" aria-label="Card view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Export Button moved into Dropdown */}
        {/* <Button
          variant="outline"
          onClick={() => toast({ title: "Export Clicked", description: "Export functionality to be implemented."})}
        >
          <Download className="mr-2 h-4 w-4" /> Export
        </Button> */}

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast({ title: "Export Clicked", description: "Export functionality to be implemented."})}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </DropdownMenuItem>
            {/* Add other menu items here if needed */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          {assetsLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
              <span className="ml-2 text-muted-foreground">Loading assets...</span>
            </div>
          )}
          {assetsError && (
            <div className="text-center py-10 px-4 text-destructive">
              <p>Error loading assets: {assetsError.message}</p>
            </div>
          )}
          {!assetsLoading && !assetsError && (
            <>
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <Table className="min-w-max">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 w-[60px]">Img</TableHead>
                        <TableHead className="sticky left-[60px] bg-background z-10 min-w-[200px]">Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead>Purchase Cost</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Warranty Expiry</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Life Exp (Yrs)</TableHead>
                        <TableHead>Depreciated Value</TableHead>
                        <TableHead>YTD Usage</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Admin Comments</TableHead>
                        <TableHead>Invoice URL</TableHead>
                        <TableHead>Barcode URL</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Updated By</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="sticky right-0 bg-background z-10 text-right w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={23} className="h-24 text-center text-muted-foreground">
                            {filterText || filterType !== 'all' || filterCondition !== 'all' || filterUnit !== 'all' || filterDivision !== 'all' || filterVendor !== 'all'
                              ? `No decommissioned assets found matching the current filters.` 
                              : "No decommissioned assets found."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAssets.map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="sticky left-0 bg-background z-10 cursor-pointer" onClick={() => handleInfoClick(asset)}>
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={asset.image_url || undefined} alt={asset.name} />
                                <AvatarFallback>{asset.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="sticky left-[60px] bg-background z-10 font-medium cursor-pointer" onClick={() => handleInfoClick(asset)}>
                                <HighlightMatch text={asset.name} searchTerm={filterText} />
                            </TableCell>
                            <TableCell>
                                <HighlightMatch text={asset.type} searchTerm={filterText} />
                            </TableCell>
                            <TableCell>
                                <HighlightMatch text={asset.condition} searchTerm={filterText} />
                            </TableCell>
                            <TableCell>
                                <HighlightMatch text={asset.assigned_to} searchTerm={filterText} />
                            </TableCell>
                            <TableCell>{asset.assigned_to_email || 'N/A'}</TableCell>
                            <TableCell>
                                <HighlightMatch text={asset.unit} searchTerm={filterText} />
                            </TableCell>
                            <TableCell>
                                <HighlightMatch text={asset.division} searchTerm={filterText} />
                            </TableCell>
                            <TableCell>{formatDate(asset.assigned_date)}</TableCell>
                            <TableCell>{formatDate(asset.purchase_date)}</TableCell>
                            <TableCell>{asset.purchase_cost != null ? `$${asset.purchase_cost.toFixed(2)}` : 'N/A'}</TableCell>
                            <TableCell>
                                <HighlightMatch text={asset.vendor} searchTerm={filterText} />
                            </TableCell>
                            <TableCell>{formatDate(asset.warranty_expiry_date)}</TableCell>
                            <TableCell>{formatDate(asset.expiry_date)}</TableCell>
                            <TableCell>{asset.life_expectancy_years ?? 'N/A'}</TableCell>
                            <TableCell>{asset.depreciated_value != null ? `$${asset.depreciated_value.toFixed(2)}` : 'N/A'}</TableCell>
                            <TableCell>{asset.ytd_usage || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate" title={asset.notes}>{asset.notes || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate" title={asset.admin_comments}>{asset.admin_comments || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate" title={asset.invoice_url}>{asset.invoice_url || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate" title={asset.barcode_url}>{asset.barcode_url || 'N/A'}</TableCell>
                            <TableCell>{formatDate(asset.last_updated, true)}</TableCell>
                            <TableCell>{asset.last_updated_by || 'N/A'}</TableCell>
                            <TableCell>{formatDate(asset.created_at, true)}</TableCell>
                            <TableCell className="sticky right-0 bg-background z-10 text-right">
                              <Dialog open={isEditModalOpen && selectedAsset?.id === asset.id} onOpenChange={(isOpen) => !isOpen && handleCloseModals()}>
                                 <DialogTrigger asChild>
                                   <Button variant="ghost" size="icon" onClick={() => handleEditClick(asset)} title="Edit Asset">
                                     <Edit className="h-4 w-4" />
                                   </Button>
                                 </DialogTrigger>
                                 {isEditModalOpen && selectedAsset?.id === asset.id && (
                                   <EditAssetModal 
                                      isOpen={true}
                                      onClose={handleCloseModals} 
                                      onEdit={handleSaveEdit}
                                      asset={selectedAsset as UserAsset} 
                                      onDelete={() => handleDeleteClick(asset)}
                                      divisions={divisions}
                                      units={units}
                                      staffMembers={staffMembers}
                                      existingNames={existingNames}
                                      existingTypes={existingTypes}
                                      existingVendors={existingVendors}
                                   />
                                 )}
                              </Dialog>
                              <Dialog open={isDeleteModalOpen && selectedAsset?.id === asset.id} onOpenChange={setIsDeleteModalOpen}>
                                 <DialogTrigger asChild>
                                   <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(asset)} title="Delete Asset">
                                     <Trash2 className="h-4 w-4 text-destructive" />
                                   </Button>
                                 </DialogTrigger>
                                 {isDeleteModalOpen && selectedAsset?.id === asset.id && (
                                   <DeleteModal 
                                     open={true}
                                     onOpenChange={setIsDeleteModalOpen} 
                                     onDelete={handleConfirmDelete}
                                     title="Delete Asset"
                                     description={`Are you sure you want to delete the asset "${selectedAsset?.name || "this asset"}"? This action cannot be undone.`}
                                   />
                                 )}
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {viewMode === 'detailed-list' && (
                <div className="overflow-x-auto">
                  <Table className="min-w-max text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 w-[50px] h-auto py-1 px-2">Img</TableHead>
                        <TableHead className="sticky left-[50px] bg-background z-10 min-w-[150px] h-auto py-1 px-2">Name</TableHead>
                        <TableHead className="h-auto py-1 px-2">Type</TableHead>
                        <TableHead className="h-auto py-1 px-2">Condition</TableHead>
                        <TableHead className="h-auto py-1 px-2">Assigned To</TableHead>
                        <TableHead className="h-auto py-1 px-2">Email</TableHead>
                        <TableHead className="h-auto py-1 px-2">Unit</TableHead>
                        <TableHead className="h-auto py-1 px-2">Division</TableHead>
                        <TableHead className="h-auto py-1 px-2">Assigned Date</TableHead>
                        <TableHead className="h-auto py-1 px-2">Purchase Date</TableHead>
                        <TableHead className="h-auto py-1 px-2">Purchase Cost</TableHead>
                        <TableHead className="h-auto py-1 px-2">Vendor</TableHead>
                        <TableHead className="h-auto py-1 px-2">Warranty Expiry</TableHead>
                        <TableHead className="h-auto py-1 px-2">Expiry Date</TableHead>
                        <TableHead className="h-auto py-1 px-2">Life Exp (Yrs)</TableHead>
                        <TableHead className="h-auto py-1 px-2">Depreciated Value</TableHead>
                        <TableHead className="h-auto py-1 px-2">YTD Usage</TableHead>
                        <TableHead className="h-auto py-1 px-2">Notes</TableHead>
                        <TableHead className="h-auto py-1 px-2">Admin Comments</TableHead>
                        <TableHead className="h-auto py-1 px-2">Invoice URL</TableHead>
                        <TableHead className="h-auto py-1 px-2">Barcode URL</TableHead>
                        <TableHead className="h-auto py-1 px-2">Last Updated</TableHead>
                        <TableHead className="h-auto py-1 px-2">Updated By</TableHead>
                        <TableHead className="h-auto py-1 px-2">Created At</TableHead>
                        <TableHead className="sticky right-0 bg-background z-10 text-right w-[80px] h-auto py-1 px-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={23} className="h-16 text-center text-muted-foreground py-1 px-2">
                             {filterText || filterType !== 'all' || filterCondition !== 'all' || filterUnit !== 'all' || filterDivision !== 'all' || filterVendor !== 'all'
                              ? `No decommissioned assets found matching the current filters.` 
                              : "No decommissioned assets found."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAssets.map((asset) => (
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
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.notes}>{asset.notes || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.admin_comments}>{asset.admin_comments || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.invoice_url}>{asset.invoice_url || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2 max-w-[150px] truncate" title={asset.barcode_url}>{asset.barcode_url || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2">{formatDate(asset.last_updated, true)}</TableCell>
                            <TableCell className="py-1 px-2">{asset.last_updated_by || 'N/A'}</TableCell>
                            <TableCell className="py-1 px-2">{formatDate(asset.created_at, true)}</TableCell>
                            <TableCell className="sticky right-0 bg-background z-10 text-right py-1 px-2">
                              <Dialog open={isEditModalOpen && selectedAsset?.id === asset.id} onOpenChange={(isOpen) => !isOpen && handleCloseModals()}>
                                 <DialogTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(asset)} title="Edit Asset">
                                     <Edit className="h-3.5 w-3.5" />
                                   </Button>
                                 </DialogTrigger>
                                 {isEditModalOpen && selectedAsset?.id === asset.id && (
                                   <EditAssetModal 
                                      isOpen={true}
                                      onClose={handleCloseModals} 
                                      onEdit={handleSaveEdit}
                                      asset={selectedAsset as UserAsset} 
                                      onDelete={() => handleDeleteClick(asset)}
                                      divisions={divisions}
                                      units={units}
                                      staffMembers={staffMembers}
                                      existingNames={existingNames}
                                      existingTypes={existingTypes}
                                      existingVendors={existingVendors}
                                   />
                                 )}
                              </Dialog>
                              <Dialog open={isDeleteModalOpen && selectedAsset?.id === asset.id} onOpenChange={setIsDeleteModalOpen}>
                                 <DialogTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteClick(asset)} title="Delete Asset">
                                     <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                   </Button>
                                 </DialogTrigger>
                                 {isDeleteModalOpen && selectedAsset?.id === asset.id && (
                                   <DeleteModal 
                                     open={true}
                                     onOpenChange={setIsDeleteModalOpen} 
                                     onDelete={handleConfirmDelete}
                                     title="Delete Asset"
                                     description={`Are you sure you want to delete the asset "${selectedAsset?.name || "this asset"}"? This action cannot be undone.`}
                                   />
                                 )}
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {viewMode === 'card' && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredAssets.length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground py-10">
                       {filterText || filterType !== 'all' || filterCondition !== 'all' || filterUnit !== 'all' || filterDivision !== 'all' || filterVendor !== 'all'
                         ? `No decommissioned assets found matching the current filters.` 
                         : "No decommissioned assets found."} 
                    </p>
                  ) : (
                    filteredAssets.map((asset) => (
                      <AssetCard 
                        key={asset.id} 
                        asset={asset} 
                        onEdit={() => handleEditClick(asset)} 
                        onDelete={() => handleDeleteClick(asset)}
                        onClick={() => handleInfoClick(asset)}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Render EditModal outside the map, controlled by selectedAsset */}
      {selectedAsset && isEditModalOpen && (
        <EditAssetModal 
            isOpen={isEditModalOpen} 
            onClose={handleCloseModals} 
            onEdit={handleSaveEdit}
            asset={selectedAsset} // No need for type assertion here
            onDelete={() => handleDeleteClick(selectedAsset)} // Ensure this uses selectedAsset
            // Pass necessary data props
            divisions={divisions}
            units={units}
            staffMembers={staffMembers}
            existingNames={existingNames}
            existingTypes={existingTypes}
            existingVendors={existingVendors}
         />
      )}

      {/* DeleteModal remains the same */}
      {selectedAsset && isDeleteModalOpen && (
          <DeleteModal 
            open={isDeleteModalOpen} 
            onOpenChange={setIsDeleteModalOpen} 
            onDelete={handleConfirmDelete}
            title="Delete Asset"
            description={`Are you sure you want to delete the asset "${selectedAsset?.name || "this asset"}"? This action cannot be undone.`}
          />
      )}

      <AssetInfoModal 
        asset={infoModalAsset} 
        isOpen={!!infoModalAsset} 
        onClose={handleCloseModals} 
      />
    </PageLayout>
  );
};

export default DecommissionedAssets; 