import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, Plus, Edit, Trash2 
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useAssetsData } from '@/hooks/useSupabaseData';
import { UserAsset } from '@/types';

// Import modal components
import AddAssetModal from '@/components/unit-tabs/modals/AddAssetModal';
import EditAssetModal from '@/components/unit-tabs/modals/EditAssetModal';
import DeleteModal from '@/components/unit-tabs/modals/DeleteModal';

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

  // Log the user object and the assets array before filtering
  console.log('[AssetManagement] User object from useAuth:', user);
  console.log('[AssetManagement] Assets array before filtering:', assets);

  // --- Reverted Filtering Logic --- 
  const loggedInUserName = user?.name;
  console.log('[AssetManagement] Logged in user name for filtering:', loggedInUserName);
  const myAssets = assets.filter(asset => {
    // Add log inside the filter for detailed comparison
    console.log(`[AssetManagement] Comparing asset.assigned_to: "${asset.assigned_to}" === loggedInUserName: "${loggedInUserName}" -> ${asset.assigned_to === loggedInUserName}`);
    return asset.assigned_to === loggedInUserName;
  });
  console.log('[AssetManagement] Assets array AFTER filtering:', myAssets);
  // --- End Reverted Filtering Logic ---

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

  // Helper to format dates nicely
  const formatDate = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return 'N/A';
    try {
      // Supabase date columns are likely strings
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      // Adjust for potential timezone issues if Supabase dates are not UTC
      // This simple approach might show the date in the user's local timezone
      return date.toLocaleDateString(); 
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Assets</h1>
          <p className="text-muted-foreground">View and manage assets assigned to you.</p>
        </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No assets assigned to you.
                    </TableCell>
                  </TableRow>
                ) : (
                  myAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={asset.image_url || undefined} alt={asset.name} />
                          <AvatarFallback>{asset.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.type || 'N/A'}</TableCell>
                      <TableCell>{asset.condition || 'N/A'}</TableCell>
                      <TableCell>{asset.assigned_to || 'N/A'}</TableCell> 
                      <TableCell>{asset.assigned_to_email || 'N/A'}</TableCell>
                      <TableCell>{formatDate(asset.assigned_date)}</TableCell>
                      <TableCell>{asset.vendor || 'N/A'}</TableCell>
                      <TableCell className="text-right">
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
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default AssetManagement; 