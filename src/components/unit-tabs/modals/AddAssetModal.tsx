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

interface AddAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Partial<UserAsset>;
  onAssetChange?: (asset: Partial<UserAsset>) => void;
  onSave?: () => void;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({
  open,
  onOpenChange,
  asset,
  onAssetChange,
  onSave
}) => {
  const defaultAsset: Partial<UserAsset> = {
    id: `asset-${Date.now()}`,
    name: '',
    type: 'laptop',
    serialNumber: '',
    assignedTo: '',
    department: '',
    purchaseDate: new Date(),
    warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default warranty 1 year
    status: 'active',
    notes: '',
    checklist: []
  };

  const assetData = asset || defaultAsset;
  
  const handleAddAsset = () => {
    if (!assetData.name) {
      toast({
        title: "Error",
        description: "Asset name is required",
      });
      return;
    }

    if (!assetData.serialNumber) {
      toast({
        title: "Error",
        description: "Serial number is required",
      });
      return;
    }

    if (!assetData.assignedTo) {
      toast({
        title: "Error",
        description: "Assigned to field is required",
      });
      return;
    }

    if (!assetData.department) {
      toast({
        title: "Error",
        description: "Department field is required",
      });
      return;
    }

    // Use the onSave callback
    if (onSave) {
      onSave();
    }
    
    onOpenChange(false);
  };

  const handleChange = (field: string, value: any) => {
    if (onAssetChange && asset) {
      onAssetChange({
        ...asset,
        [field]: value
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Create a new asset with the form below
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="asset-name">Asset Name <span className="text-destructive">*</span></Label>
            <Input 
              id="asset-name" 
              placeholder="Asset Name" 
              value={assetData.name || ''} 
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-type">Type</Label>
              <Select 
                value={assetData.type || 'laptop'}
                onValueChange={(value: 'laptop' | 'mobile' | 'tablet' | 'software' | 'other') => 
                  handleChange('type', value)
                }
              >
                <SelectTrigger id="asset-type">
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
              <Label htmlFor="asset-status">Status</Label>
              <Select 
                value={assetData.status || 'active'}
                onValueChange={(value: 'active' | 'maintenance' | 'retired') => 
                  handleChange('status', value)
                }
              >
                <SelectTrigger id="asset-status">
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
            <Label htmlFor="asset-serial">Serial Number <span className="text-destructive">*</span></Label>
            <Input 
              id="asset-serial" 
              placeholder="Serial Number" 
              value={assetData.serialNumber || ''} 
              onChange={(e) => handleChange('serialNumber', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-assigned">Assigned To <span className="text-destructive">*</span></Label>
              <Input 
                id="asset-assigned" 
                placeholder="User Name" 
                value={assetData.assignedTo || ''} 
                onChange={(e) => handleChange('assignedTo', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-department">Department <span className="text-destructive">*</span></Label>
              <Input 
                id="asset-department" 
                placeholder="Department" 
                value={assetData.department || ''} 
                onChange={(e) => handleChange('department', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-purchase-date">Purchase Date</Label>
              <DatePicker 
                date={assetData.purchaseDate} 
                setDate={(date) => handleChange('purchaseDate', date)} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-warranty">Warranty Expiry</Label>
              <DatePicker 
                date={assetData.warrantyExpiry} 
                setDate={(date) => handleChange('warrantyExpiry', date)} 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <FileUpload 
              onFileUpload={(base64) => handleChange('imageUrl', base64)}
              currentImage={assetData.imageUrl}
              label="Asset Image"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="asset-notes">Notes</Label>
            <Textarea 
              id="asset-notes" 
              placeholder="Additional notes about the asset" 
              value={assetData.notes || ''} 
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>
        
        <div className="border-t pt-4 mt-2">
          <ChecklistSection 
            items={assetData.checklist || []}
            onChange={(items) => handleChange('checklist', items)}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddAsset}>Add Asset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetModal; 