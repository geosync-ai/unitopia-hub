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
import { UserAsset } from '@/types';
import { toast } from "@/components/ui/use-toast";
import DatePicker from '@/components/DatePicker';
import FileUpload from '@/components/FileUpload';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UserAsset | null;
  onEdit: (editedAsset: Partial<UserAsset>) => void;
  onDelete?: () => void;
}

const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  try {
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  onEdit,
  onDelete
}) => {
  const [editedAsset, setEditedAsset] = useState<Partial<UserAsset>>(asset || {});
  
  useEffect(() => {
    setEditedAsset(asset || {});
  }, [asset]);

  const handleSaveAsset = () => {
    if (!editedAsset || !asset) return;

    if (!editedAsset.name) {
      toast({ title: "Validation Error", description: "Asset name is required", variant: "destructive" });
      return;
    }

    onEdit(editedAsset);
    
    onClose();
  };

  const handleChange = (field: keyof UserAsset, value: any) => {
    setEditedAsset(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field: keyof UserAsset, date: Date | null | undefined) => {
    handleChange(field, date ? formatDateForInput(date) : null);
  };

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Make changes to the asset details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-name">Asset Name <span className="text-destructive">*</span></Label>
              <Input id="edit-asset-name" placeholder="e.g., Dell Laptop XYZ" value={editedAsset.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-type">Type</Label>
              <Input id="edit-asset-type" placeholder="e.g., Laptop, Monitor, Phone" value={editedAsset.type || ''} onChange={(e) => handleChange('type', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-unit">Unit</Label>
              <Input id="edit-asset-unit" placeholder="e.g., IT Unit" value={editedAsset.unit || ''} onChange={(e) => handleChange('unit', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-division">Division</Label>
              <Input id="edit-asset-division" placeholder="e.g., Corporate Services" value={editedAsset.division || ''} onChange={(e) => handleChange('division', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-assigned-to">Assigned To</Label>
              <Input id="edit-asset-assigned-to" value={editedAsset.assigned_to || ''} readOnly disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-assigned-email">Assigned Email</Label>
              <Input id="edit-asset-assigned-email" value={editedAsset.assigned_to_email || ''} readOnly disabled />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-asset-assigned-date">Assigned Date</Label>
            <Input id="edit-asset-assigned-date" value={formatDateForInput(editedAsset.assigned_date)} readOnly disabled />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-condition">Condition</Label>
              <Input id="edit-asset-condition" placeholder="e.g., New, Good, Fair, Poor" value={editedAsset.condition || ''} onChange={(e) => handleChange('condition', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-vendor">Vendor</Label>
              <Input id="edit-asset-vendor" placeholder="e.g., Dell Inc., Apple Store" value={editedAsset.vendor || ''} onChange={(e) => handleChange('vendor', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-purchase-date">Purchase Date</Label>
              <DatePicker date={editedAsset.purchase_date ? new Date(editedAsset.purchase_date) : undefined} setDate={(date) => handleDateChange('purchase_date', date)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-warranty">Warranty Expiry Date</Label>
              <DatePicker date={editedAsset.warranty_expiry_date ? new Date(editedAsset.warranty_expiry_date) : undefined} setDate={(date) => handleDateChange('warranty_expiry_date', date)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-expiry-date">Expiry Date (e.g., Software)</Label>
              <DatePicker date={editedAsset.expiry_date ? new Date(editedAsset.expiry_date) : undefined} setDate={(date) => handleDateChange('expiry_date', date)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-life">Life Expectancy (Years)</Label>
              <Input id="edit-asset-life" type="number" placeholder="e.g., 3" value={editedAsset.life_expectancy_years ?? ''} onChange={(e) => handleChange('life_expectancy_years', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-invoice-url">Invoice URL</Label>
              <Input id="edit-asset-invoice-url" placeholder="https://..." value={editedAsset.invoice_url || ''} onChange={(e) => handleChange('invoice_url', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-barcode-url">Barcode URL</Label>
              <Input id="edit-asset-barcode-url" placeholder="https://..." value={editedAsset.barcode_url || ''} onChange={(e) => handleChange('barcode_url', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-asset-ytd-usage">YTD Usage</Label>
            <Input id="edit-asset-ytd-usage" placeholder="e.g., 50 hours, 1000km" value={editedAsset.ytd_usage || ''} onChange={(e) => handleChange('ytd_usage', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-asset-notes">Notes</Label>
            <Textarea id="edit-asset-notes" placeholder="Additional notes about the asset" value={editedAsset.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-asset-admin-comments">Admin Comments</Label>
            <Textarea id="edit-asset-admin-comments" placeholder="Internal comments" value={editedAsset.admin_comments || ''} onChange={(e) => handleChange('admin_comments', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <FileUpload 
              onFileUpload={(url) => handleChange('image_url', url)}
              currentImage={editedAsset.image_url}
              label="Asset Image"
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