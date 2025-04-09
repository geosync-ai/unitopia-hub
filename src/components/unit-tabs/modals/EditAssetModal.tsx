import React from 'react';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: UserAsset | null;
  onAssetChange: (asset: UserAsset) => void;
  onSave: (asset: UserAsset) => void;
}

const EditAssetModal: React.FC<EditAssetModalProps> = ({
  open,
  onOpenChange,
  asset,
  onAssetChange,
  onSave
}) => {
  const handleSaveAsset = () => {
    if (!asset) return;

    if (!asset.name) {
      toast({
        title: "Error",
        description: "Asset name is required",
      });
      return;
    }

    if (!asset.serialNumber) {
      toast({
        title: "Error",
        description: "Serial number is required",
      });
      return;
    }

    if (!asset.assignedTo) {
      toast({
        title: "Error",
        description: "Assigned to field is required",
      });
      return;
    }

    if (!asset.department) {
      toast({
        title: "Error",
        description: "Department field is required",
      });
      return;
    }

    // Save the asset
    onSave(asset);
    
    // Close the modal
    onOpenChange(false);
    
    toast({
      title: "Asset Updated",
      description: "The asset has been successfully updated",
    });
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={asset.name || ''} 
              onChange={(e) => onAssetChange({...asset, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-type">Type</Label>
              <Select 
                value={asset.type || 'laptop'}
                onValueChange={(value: 'laptop' | 'mobile' | 'tablet' | 'software' | 'other') => 
                  onAssetChange({...asset, type: value})
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
                value={asset.status || 'active'}
                onValueChange={(value: 'active' | 'maintenance' | 'retired') => 
                  onAssetChange({...asset, status: value})
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
              value={asset.serialNumber || ''} 
              onChange={(e) => onAssetChange({...asset, serialNumber: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-assigned">Assigned To <span className="text-destructive">*</span></Label>
              <Input 
                id="edit-asset-assigned" 
                placeholder="User Name" 
                value={asset.assignedTo || ''} 
                onChange={(e) => onAssetChange({...asset, assignedTo: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-department">Department <span className="text-destructive">*</span></Label>
              <Input 
                id="edit-asset-department" 
                placeholder="Department" 
                value={asset.department || ''} 
                onChange={(e) => onAssetChange({...asset, department: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-purchase-date">Purchase Date</Label>
              <DatePicker 
                date={asset.purchaseDate} 
                setDate={(date) => onAssetChange({...asset, purchaseDate: date})} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-asset-warranty">Warranty Expiry</Label>
              <DatePicker 
                date={asset.warrantyExpiry} 
                setDate={(date) => onAssetChange({...asset, warrantyExpiry: date})} 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <FileUpload 
              onFileUpload={(base64) => onAssetChange({...asset, imageUrl: base64})}
              currentImage={asset.imageUrl}
              label="Asset Image"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-asset-notes">Notes</Label>
            <Textarea 
              id="edit-asset-notes" 
              placeholder="Additional notes about the asset" 
              value={asset.notes || ''} 
              onChange={(e) => onAssetChange({...asset, notes: e.target.value})}
            />
          </div>
        </div>
        
        <div className="border-t pt-4 mt-2">
          <ChecklistSection 
            items={asset.checklist || []}
            onChange={(items) => onAssetChange({...asset, checklist: items})}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveAsset}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssetModal; 