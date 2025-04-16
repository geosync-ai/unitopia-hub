import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Loader2, Plus, Edit, Trash2, List, LayoutGrid 
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useAssetsData } from '@/hooks/useSupabaseData';
import { UserAsset } from '@/types';

// Import modal components
import AddAssetModal from '@/components/unit-tabs/modals/AddAssetModal';
import EditAssetModal from '@/components/unit-tabs/modals/EditAssetModal';
import DeleteModal from '@/components/unit-tabs/modals/DeleteModal';
import AssetCard from '@/components/assets/AssetCard';

const AssetManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use the asset data hook
  const { 
    data: assets, 
    loading, 
    error, 
    add: addAsset, 
    update: editAsset, 
    remove: deleteAsset, 
    refresh 
  } = useAssetsData();

  // State for managing modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<UserAsset | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Log the user object and the assets array before filtering
  console.log('[AssetManagement] User object from useAuth:', user);
  console.log('[AssetManagement] Assets array before filtering:', assets);

  // --- Filtering Logic ---
  const loggedInUserName = user?.name;
  console.log('[AssetManagement] Logged in user name for filtering:', loggedInUserName);
  const myAssets = assets.filter(asset => {
    // Use the correct camelCase property 'assignedTo' after conversion
    console.log(`[AssetManagement] Comparing asset.assignedTo: "${asset.assignedTo}" === loggedInUserName: "${loggedInUserName}" -> ${asset.assignedTo === loggedInUserName}`);
    return asset.assignedTo === loggedInUserName; 
  });
  console.log('[AssetManagement] Assets array AFTER filtering:', myAssets);
  // --- End Filtering Logic ---

  // --- Email for filtering (keep for when DB is updated) ---
  const loggedInUserEmail = user?.email;
  // --- End Email for filtering ---

  // Fetch data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

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
  };

  // --- Data Operation Handlers ---

  const handleSaveAdd = async (newAssetData: Partial<Omit<UserAsset, 'id' | 'created_at' | 'last_updated'>>) => {
    const today = new Date().toISOString().split('T')[0];
    const completeAssetData = {
      ...newAssetData,
      assigned_to: user?.name, // Assign current user's name
      assigned_to_email: loggedInUserEmail, // Still attempt to assign email for new assets
      assigned_date: newAssetData.assigned_date || today,
    } as Omit<UserAsset, 'id' | 'created_at' | 'last_updated'>;
    
    if (!completeAssetData.name) {
      toast({ title: "Error", description: "Asset name is required.", variant: "destructive" });
      return;
    }
    // Keep the email check for new assets, assuming it *should* be there going forward
    if (!completeAssetData.assigned_to_email) {
        toast({ title: "Error", description: "Assignee email could not be determined.", variant: "destructive" });
        return;
    }

    try {
      await addAsset(completeAssetData as any);
      toast({ title: "Asset Added", description: "New asset has been added successfully." });
      handleCloseModals();
      refresh();
    } catch (err) {
      console.error("Error adding asset:", err);
      toast({ title: "Error Adding Asset", description: err instanceof Error ? err.message : "Could not add asset.", variant: "destructive" });
    }
  };

  // Use Partial<UserAsset> for updates
  const handleSaveEdit = async (updatedAssetData: Partial<UserAsset>) => {
    if (!selectedAsset) return;
    try {
      // Add last_updated_by if needed
      const dataToSave = loggedInUserEmail ? { ...updatedAssetData, last_updated_by: loggedInUserEmail } : updatedAssetData;
      await editAsset(selectedAsset.id, dataToSave);
      toast({ title: "Asset Updated", description: "Asset details have been updated." });
      handleCloseModals();
      refresh();
    } catch (err) {
      console.error("Error updating asset:", err);
      toast({ title: "Error Updating Asset", description: err instanceof Error ? err.message : "Could not update asset.", variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAsset) return;
    try {
      await deleteAsset(selectedAsset.id);
      toast({ title: "Asset Deleted", description: "Asset has been removed successfully." });
      handleCloseModals();
      refresh();
    } catch (err) {
      console.error("Error deleting asset:", err);
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

  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">My Assets</h1>
          <p className="text-muted-foreground">View and manage assets assigned to you.</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup 
            type="single" 
            defaultValue="table" 
            value={viewMode}
            onValueChange={(value) => { if (value) setViewMode(value as 'table' | 'card'); }}
            aria-label="View mode"
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddClick}>
                <Plus className="mr-2 h-4 w-4" /> Add Asset
              </Button>
            </DialogTrigger>
            <AddAssetModal 
              isOpen={isAddModalOpen} 
              onClose={handleCloseModals} 
              onAdd={handleSaveAdd}
            />
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
              <span className="ml-2 text-muted-foreground">Loading assets...</span>
            </div>
          )}
          {error && (
            <div className="text-center py-10 px-4 text-destructive">
              <p>Error loading assets: {error.message}</p>
              <Button onClick={refresh} variant="outline" className="mt-4">Try Again</Button>
            </div>
          )}
          {!loading && !error && (
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
                        <TableHead>Vendor</TableHead>
                        <TableHead>Warranty Expiry</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Life Exp (Yrs)</TableHead>
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
                      {myAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={23} className="h-24 text-center text-muted-foreground">
                            No assets assigned to you.
                          </TableCell>
                        </TableRow>
                      ) : (
                        myAssets.map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="sticky left-0 bg-background z-10">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={asset.imageUrl || undefined} alt={asset.name} />
                                <AvatarFallback>{asset.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="sticky left-[60px] bg-background z-10 font-medium">{asset.name}</TableCell>
                            <TableCell>{asset.type || 'N/A'}</TableCell>
                            <TableCell>{asset.condition || 'N/A'}</TableCell>
                            <TableCell>{asset.assignedTo || 'N/A'}</TableCell>
                            <TableCell>{asset.assignedToEmail || 'N/A'}</TableCell>
                            <TableCell>{asset.unit || 'N/A'}</TableCell>
                            <TableCell>{asset.division || 'N/A'}</TableCell>
                            <TableCell>{formatDate(asset.assignedDate)}</TableCell>
                            <TableCell>{formatDate(asset.purchaseDate)}</TableCell>
                            <TableCell>{asset.vendor || 'N/A'}</TableCell>
                            <TableCell>{formatDate(asset.warrantyExpiryDate)}</TableCell>
                            <TableCell>{formatDate(asset.expiryDate)}</TableCell>
                            <TableCell>{asset.lifeExpectancyYears ?? 'N/A'}</TableCell>
                            <TableCell>{asset.ytdUsage || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate" title={asset.notes}>{asset.notes || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate" title={asset.adminComments}>{asset.adminComments || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate" title={asset.invoiceUrl}>{asset.invoiceUrl || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate" title={asset.barcodeUrl}>{asset.barcodeUrl || 'N/A'}</TableCell>
                            <TableCell>{formatDate(asset.lastUpdated, true)}</TableCell>
                            <TableCell>{asset.lastUpdatedBy || 'N/A'}</TableCell>
                            <TableCell>{formatDate(asset.createdAt, true)}</TableCell>
                            <TableCell className="sticky right-0 bg-background z-10 text-right">
                              <Dialog open={isEditModalOpen && selectedAsset?.id === asset.id} onOpenChange={(isOpen) => !isOpen && handleCloseModals()}>
                                 <DialogTrigger asChild>
                                   <Button variant="ghost" size="icon" onClick={() => handleEditClick(asset)} title="Edit Asset">
                                     <Edit className="h-4 w-4" />
                                   </Button>
                                 </DialogTrigger>
                                 <EditAssetModal 
                                    isOpen={isEditModalOpen && selectedAsset?.id === asset.id} 
                                    onClose={handleCloseModals} 
                                    onEdit={handleSaveEdit}
                                    asset={selectedAsset as UserAsset} 
                                    onDelete={() => handleDeleteClick(asset)}
                                 />
                              </Dialog>
                              <Dialog open={isDeleteModalOpen && selectedAsset?.id === asset.id} onOpenChange={setIsDeleteModalOpen}>
                                 <DialogTrigger asChild>
                                   <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(asset)} title="Delete Asset">
                                     <Trash2 className="h-4 w-4 text-destructive" />
                                   </Button>
                                 </DialogTrigger>
                                 <DeleteModal 
                                   open={isDeleteModalOpen && selectedAsset?.id === asset.id} 
                                   onOpenChange={setIsDeleteModalOpen} 
                                   onDelete={handleConfirmDelete}
                                   title="Delete Asset"
                                   description={`Are you sure you want to delete the asset "${selectedAsset?.name || "this asset"}"? This action cannot be undone.`}
                                 />
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
                  {myAssets.length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground py-10">No assets assigned to you.</p>
                  ) : (
                    myAssets.map((asset) => (
                      <AssetCard 
                        key={asset.id} 
                        asset={asset} 
                        onEdit={() => handleEditClick(asset)} 
                        onDelete={() => handleDeleteClick(asset)}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedAsset && (
        <> 
          <EditAssetModal 
            isOpen={isEditModalOpen} 
            onClose={handleCloseModals} 
            onEdit={handleSaveEdit}
            asset={selectedAsset}
            onDelete={() => handleDeleteClick(selectedAsset)}
          />
          <DeleteModal 
            open={isDeleteModalOpen} 
            onOpenChange={setIsDeleteModalOpen} 
            onDelete={handleConfirmDelete}
            title="Delete Asset"
            description={`Are you sure you want to delete the asset "${selectedAsset?.name || "this asset"}"? This action cannot be undone.`}
          />
        </>
      )}
    </PageLayout>
  );
};

export default AssetManagement; 