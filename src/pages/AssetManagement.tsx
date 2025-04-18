import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Loader2, Plus, Edit, Trash2, List, LayoutGrid, Search 
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase, logger } from '@/lib/supabaseClient'; // Import supabase
import { User } from '@supabase/supabase-js'; // Import User type
import { useAssetsData } from '@/hooks/useSupabaseData';
import { UserAsset } from '@/types';

// Import modal components
import AddAssetModal from '@/components/unit-tabs/modals/AddAssetModal';
import EditAssetModal from '@/components/unit-tabs/modals/EditAssetModal';
import DeleteModal from '@/components/unit-tabs/modals/DeleteModal';
import AssetCard from '@/components/assets/AssetCard';
import HighlightMatch from '@/components/ui/HighlightMatch';

// Define interface for User Profile (adjust based on your actual profile table structure)
interface UserProfile {
  full_name?: string;
  // Add other profile fields if needed
}

const AssetManagement = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfileName, setUserProfileName] = useState<string | null>(null); // <-- Add state for profile name
  const [userLoading, setUserLoading] = useState(true);
  const { toast } = useToast();

  // Use the asset data hook
  const { 
    data: assets, 
    loading: assetsLoading, 
    error: assetsError, 
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
  const [filterText, setFilterText] = useState('');

  // Fetch user and profile data on mount
  useEffect(() => {
    let isMounted = true;
    setUserLoading(true);
    logger.info('AssetManagement Page: Fetching user and profile data...');

    const fetchUserData = async () => {
      try {
        // Fetch user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (userError) {
          throw userError;
        }

        if (userData.user) {
          logger.success('AssetManagement Page: User data fetched', userData.user);
          setCurrentUser(userData.user);

          // Fetch profile using user ID
          const { data: profileData, error: profileError } = await supabase
            .from('staff_members') 
            .select('name') // Select the column containing the user's full name
            .eq('email', userData.user.email) // <-- Match using email instead of id
            .single(); // Fetch a single record

          if (!isMounted) return;

          if (profileError) {
            logger.warn('AssetManagement Page: Could not fetch user profile', profileError);
            // Decide how to handle missing profile: fallback to email or show error?
            // For now, we'll let it be null and the filter will handle it
          } else if (profileData) {
            logger.success('AssetManagement Page: User profile fetched', profileData);
            setUserProfileName(profileData.name || null); // <-- Set profile name state (using 'name' column)
          } else {
            logger.warn('AssetManagement Page: No profile found for user');
          }

        } else {
           logger.warn('AssetManagement Page: No user data found.');
           // Handle case where getUser returns null user without error
        }

      } catch (err) {
        if (isMounted) {
            logger.error('AssetManagement Page: Error fetching user or profile data', err);
            toast({ title: "Error", description: "Failed to load user information.", variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setUserLoading(false);
        }
      }
    };

    fetchUserData();

    // Auth state change listener remains the same
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT') {
            logger.info('AssetManagement Page: User signed out.');
            setCurrentUser(null);
            setUserProfileName(null); // Clear profile name on sign out
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
             // Re-fetch user and profile data if auth state changes significantly
             if(session?.user?.id !== currentUser?.id) {
                fetchUserData();
             }
        }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [toast]); // Keep dependencies minimal, fetchUserData is defined inside

  // Log the user object and the assets array before filtering
  console.log('[AssetManagement] Current User object:', currentUser);
  console.log('[AssetManagement] User Profile Name for filtering:', userProfileName); // <-- Log profile name
  console.log('[AssetManagement] Assets array before filtering:', assets);

  // --- Filtering Logic ---
  // const loggedInUserName = currentUser?.user_metadata?.name || currentUser?.email; // <-- Keep original logic commented out for reference
  // console.log('[AssetManagement] Logged in user name/email for filtering:', loggedInUserName); // <-- Keep original logic commented out for reference

  const myAssets = assets
    // Filter by matching assigned_to with the fetched userProfileName
    .filter(asset => userProfileName && asset.assigned_to === userProfileName) // <-- Updated filter condition
    .filter(asset => {
      const searchTerm = filterText.toLowerCase();
      if (!searchTerm) return true;
      
      return (
        asset.name?.toLowerCase().includes(searchTerm) ||
        asset.type?.toLowerCase().includes(searchTerm) ||
        asset.condition?.toLowerCase().includes(searchTerm) ||
        asset.vendor?.toLowerCase().includes(searchTerm) ||
        asset.unit?.toLowerCase().includes(searchTerm) ||
        asset.division?.toLowerCase().includes(searchTerm) ||
        asset.assigned_to?.toLowerCase().includes(searchTerm)
      );
    });

  console.log(`[AssetManagement] Filter text: "${filterText}"`);
  console.log('[AssetManagement] Assets array AFTER filtering:', myAssets);
  // --- End Filtering Logic ---

  // --- Email for filtering (keep for when DB is updated) ---
  const loggedInUserEmail = currentUser?.email;
  // --- End Email for filtering ---

  // Fetch data on mount (refresh might be redundant if useAssetsData fetches initially)
  // Consider if refresh() is needed here or if useAssetsData handles initial fetch
  // useEffect(() => {
  //   refresh();
  // }, [refresh]);

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
      assigned_to: userProfileName || currentUser?.email, // <-- Use profile name if available, fallback to email for new assets
      assigned_to_email: loggedInUserEmail, // Keep email assignment separate
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

  // Add loading state for user data
  if (userLoading) {
    return (
        <PageLayout>
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading user information...</span>
            </div>
        </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <div className="flex-grow">
          <h1 className="text-2xl font-semibold">My Assets</h1>
          <p className="text-muted-foreground mb-2">View and manage assets assigned to you.</p>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Filter by name, type, vendor..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
          {assetsLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
              <span className="ml-2 text-muted-foreground">Loading assets...</span>
            </div>
          )}
          {assetsError && (
            <div className="text-center py-10 px-4 text-destructive">
              <p>Error loading assets: {assetsError.message}</p>
              <Button onClick={refresh} variant="outline" className="mt-4">Try Again</Button>
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
                            {filterText ? `No assets found matching "${filterText}".` : "No assets assigned to you."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        myAssets.map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="sticky left-0 bg-background z-10">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={asset.image_url || undefined} alt={asset.name} />
                                <AvatarFallback>{asset.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="sticky left-[60px] bg-background z-10 font-medium">
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
                            <TableCell>
                                <HighlightMatch text={asset.vendor} searchTerm={filterText} />
                            </TableCell>
                            <TableCell>{formatDate(asset.warranty_expiry_date)}</TableCell>
                            <TableCell>{formatDate(asset.expiry_date)}</TableCell>
                            <TableCell>{asset.life_expectancy_years ?? 'N/A'}</TableCell>
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
                    <p className="col-span-full text-center text-muted-foreground py-10">
                      {filterText ? `No assets found matching "${filterText}".` : "No assets assigned to you."}
                    </p>
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