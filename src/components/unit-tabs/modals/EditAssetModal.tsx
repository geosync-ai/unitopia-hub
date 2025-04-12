import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChecklistSection from '@/components/ChecklistSection';
import { UserAsset } from '@/types';
import { toast } from "@/components/ui/use-toast";
import DatePicker from '@/components/DatePicker';
import FileUpload from '@/components/FileUpload';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UserAsset;
  onEdit: (editedAsset: Partial<UserAsset>) => void;
  onDelete?: () => void;
}

const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  onEdit,
  onDelete
}) => {
  const [editedAsset, setEditedAsset] = useState<UserAsset>(asset);
  
  // Update local state when asset prop changes
  useEffect(() => {
    setEditedAsset(asset);
  }, [asset]);

  const handleSaveAsset = () => {
    if (!editedAsset) return;

    if (!editedAsset.name) {
      toast({
        title: "Error",
        description: "Asset name is required",
      });
      return;
    }

    if (!editedAsset.serialNumber) {
      toast({
        title: "Error",
        description: "Serial number is required",
      });
      return;
    }

    if (!editedAsset.assignedTo) {
      toast({
        title: "Error",
        description: "Assigned to field is required",
      });
      return;
    }

    // Save the asset
    onEdit(editedAsset);
    
    // Close the modal
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setEditedAsset(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Make changes to the asset details
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-asset-name">Asset Name <span className="text-destructive">*</span></Label>
            <Input 
              id="edit-asset-name" 
              placeholder="Asset Name" 
              value={editedAsset.name || ''} 
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-type">Type</Label>
              <Select 
                value={editedAsset.type || 'laptop'}
                onValueChange={(value: 'laptop' | 'mobile' | 'tablet' | 'software' | 'other') => 
                  handleChange('type', value)
                }
              >
                <SelectTrigger id="edit-asset-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-status">Status</Label>
              <Select 
                value={editedAsset.status || 'active'}
                onValueChange={(value: 'active' | 'maintenance' | 'retired') => 
                  handleChange('status', value)
                }
              >
                <SelectTrigger id="edit-asset-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-asset-serial">Serial Number <span className="text-destructive">*</span></Label>
            <Input 
              id="edit-asset-serial" 
              placeholder="Serial Number" 
              value={editedAsset.serialNumber || ''} 
              onChange={(e) => handleChange('serialNumber', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-assigned">Assigned To <span className="text-destructive">*</span></Label>
              <Input 
                id="edit-asset-assigned" 
                placeholder="User Name" 
                value={editedAsset.assignedTo || ''} 
                onChange={(e) => handleChange('assignedTo', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-department">Department</Label>
              <Input 
                id="edit-asset-department" 
                placeholder="Department" 
                value={editedAsset.department || ''} 
                onChange={(e) => handleChange('department', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-purchase-date">Purchase Date</Label>
              <DatePicker 
                date={editedAsset.purchaseDate} 
                setDate={(date) => handleChange('purchaseDate', date)} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-warranty">Warranty Expiry</Label>
              <DatePicker 
                date={editedAsset.warrantyExpiry} 
                setDate={(date) => handleChange('warrantyExpiry', date)} 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-asset-notes">Notes</Label>
            <Textarea 
              id="edit-asset-notes" 
              placeholder="Additional notes about the asset" 
              value={editedAsset.notes || ''} 
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter className="space-x-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="mr-auto">
              Delete Asset
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveAsset}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssetModal; 