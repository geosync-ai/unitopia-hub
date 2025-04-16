import React, { useState, useEffect, useCallback } from 'react';
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

  // Filter assets assigned to the current user's NAME
  const loggedInUserName = user?.name; // Use the name property from useAuth user object
  const myAssets = assets.filter(asset => asset.assignedTo === loggedInUserName);

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

  // Use Omit<UserAsset, 'id'> as expected by the modal prop
  const handleSaveAdd = async (newAssetData: Omit<UserAsset, 'id'>) => { 
    try {
      // Ensure the new asset is assigned to the current user if Add modal doesn't handle it
      const assetToSave = loggedInUserName ? { ...newAssetData, assignedTo: loggedInUserName } : newAssetData;
      
      await addAsset(assetToSave);
      toast({ title: "Asset Added", description: "New asset has been added successfully." });
      handleCloseModals();
      refresh();
    } catch (err) {
      toast({ title: "Error Adding Asset", description: err instanceof Error ? err.message : "Could not add asset.", variant: "destructive" });
    }
  };

  // Use Partial<UserAsset> as expected by the modal prop
  const handleSaveEdit = async (updatedAssetData: Partial<UserAsset>) => {
    if (!selectedAsset) return;
    try {
      await editAsset(selectedAsset.id, updatedAssetData);
      toast({ title: "Asset Updated", description: "Asset details have been updated." });
      handleCloseModals();
      refresh();
    } catch (err) {
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
      toast({ title: "Error Deleting Asset", description: err instanceof Error ? err.message : "Could not delete asset.", variant: "destructive" });
    }
  };

  // Helper to format dates nicely
  const formatDate = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return 'N/A';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
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
          {/* Pass correct props to AddAssetModal */}
          <AddAssetModal 
            isOpen={isAddModalOpen} 
            onClose={handleCloseModals} 
            onAdd={handleSaveAdd} // Use onAdd prop
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
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Serial No.</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No assets assigned to you.
                    </TableCell>
                  </TableRow>
                ) : (
                  myAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={asset.imageUrl || undefined} alt={asset.name} />
                          <AvatarFallback>{asset.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.type || 'N/A'}</TableCell>
                      <TableCell>{asset.status || 'N/A'}</TableCell>
                      <TableCell>{asset.assignedTo || 'N/A'}</TableCell> 
                      <TableCell>{formatDate(asset.purchaseDate)}</TableCell>
                      <TableCell>{asset.serialNumber || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                         {/* Edit Action */}
                         <Dialog open={isEditModalOpen && selectedAsset?.id === asset.id} onOpenChange={(isOpen) => !isOpen && handleCloseModals()}>
                           <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(asset)} title="Edit Asset">
                                <Edit className="h-4 w-4" />
                              </Button>
                           </DialogTrigger>
                           {/* Pass correct props to EditAssetModal */}
                           <EditAssetModal 
                              isOpen={isEditModalOpen && selectedAsset?.id === asset.id} 
                              onClose={handleCloseModals} 
                              onEdit={handleSaveEdit} // Use onEdit prop
                              asset={selectedAsset as UserAsset} // Pass selected asset, assert type
                              onDelete={() => handleDeleteClick(asset)} // Pass delete handler
                           />
                         </Dialog>

                         {/* Delete Action */}
                         {/* Pass correct props to DeleteModal */}
                         <Dialog open={isDeleteModalOpen && selectedAsset?.id === asset.id} onOpenChange={setIsDeleteModalOpen}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(asset)} title="Delete Asset">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </DialogTrigger>
                            <DeleteModal 
                              open={isDeleteModalOpen && selectedAsset?.id === asset.id} // Use open prop
                              onOpenChange={setIsDeleteModalOpen} // Use onOpenChange prop
                              onDelete={handleConfirmDelete} // Use onDelete prop
                              title="Delete Asset" // Provide title
                              description={`Are you sure you want to delete the asset "${selectedAsset?.name || "this asset"}"? This action cannot be undone.`} // Provide description
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