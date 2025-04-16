import React, { useState } from 'react';
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

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: Partial<Omit<UserAsset, 'id' | 'created_at' | 'last_updated' | 'assigned_to' | 'assigned_to_email' | 'assigned_date'>>) => void;
}

// Helper to format Date to YYYY-MM-DD string or return existing string/null
const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') return date; // Already a string
  try {
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  // Initialize state based on UserAsset type (excluding fields set by parent)
  const [newAsset, setNewAsset] = useState<Partial<Omit<UserAsset, 'id' | 'created_at' | 'last_updated' | 'assigned_to' | 'assigned_to_email' | 'assigned_date'>>>({ 
    name: '',
    type: '', 
    unit: '',
    division: '',
    purchase_date: formatDateForInput(new Date()), // Default to today
    vendor: '',
    warranty_expiry_date: formatDateForInput(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // Default 1 year
    invoice_url: '',
    expiry_date: '', 
    life_expectancy_years: undefined,
    condition: '', 
    ytd_usage: '',
    specifications: {},
    notes: '',
    barcode_url: '',
    image_url: '', 
    admin_comments: '',
    last_updated_by: '' // Or set this in parent if needed
    // checklist: [] // Assuming not used for now
  });
  
  const handleAddAsset = () => {
    // Basic validation (add more as needed)
    if (!newAsset.name) {
      toast({ title: "Validation Error", description: "Asset name is required", variant: "destructive" });
      return;
    }
    if (!newAsset.assigned_date && !newAsset.purchase_date) {
       // Parent sets assigned_date, but maybe add basic check
       // console.warn("Assigned date or purchase date might be missing");
    }

    onAdd(newAsset);
    handleCloseAndReset();
  };

  const handleCloseAndReset = () => {
    setNewAsset({ /* Reset state fields */ 
        name: '', type: '', unit: '', division: '', purchase_date: formatDateForInput(new Date()), 
        vendor: '', warranty_expiry_date: formatDateForInput(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        invoice_url: '', expiry_date: '', life_expectancy_years: undefined, condition: '', ytd_usage: '',
        specifications: {}, notes: '', barcode_url: '', image_url: '', admin_comments: '', last_updated_by: ''
    });
    onClose();
  }

  const handleChange = (field: keyof typeof newAsset, value: any) => {
    setNewAsset(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for date picker (assuming it returns a Date object)
  const handleDateChange = (field: keyof typeof newAsset, date: Date | null | undefined) => {
     handleChange(field, date ? formatDateForInput(date) : null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseAndReset()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Fill in the details for the new asset. Fields marked with * are recommended.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Row 1: Name & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="asset-name">Asset Name <span className="text-destructive">*</span></Label>
              <Input id="asset-name" placeholder="e.g., Dell Laptop XYZ" value={newAsset.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asset-type">Type</Label>
              <Input id="asset-type" placeholder="e.g., Laptop, Monitor, Phone" value={newAsset.type || ''} onChange={(e) => handleChange('type', e.target.value)} />
            </div>
          </div>

          {/* Row 2: Unit & Division */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label htmlFor="asset-unit">Unit</Label>
               <Input id="asset-unit" placeholder="e.g., IT Unit" value={newAsset.unit || ''} onChange={(e) => handleChange('unit', e.target.value)} />
             </div>
             <div className="grid gap-2">
               <Label htmlFor="asset-division">Division</Label>
               <Input id="asset-division" placeholder="e.g., Corporate Services" value={newAsset.division || ''} onChange={(e) => handleChange('division', e.target.value)} />
             </div>
          </div>

          {/* Row 3: Condition & Vendor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label htmlFor="asset-condition">Condition</Label>
               <Input id="asset-condition" placeholder="e.g., New, Good, Fair, Poor" value={newAsset.condition || ''} onChange={(e) => handleChange('condition', e.target.value)} />
             </div>
             <div className="grid gap-2">
               <Label htmlFor="asset-vendor">Vendor</Label>
               <Input id="asset-vendor" placeholder="e.g., Dell Inc., Apple Store" value={newAsset.vendor || ''} onChange={(e) => handleChange('vendor', e.target.value)} />
             </div>
          </div>

          {/* Row 4: Purchase Date & Warranty Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="asset-purchase-date">Purchase Date</Label>
              <DatePicker date={newAsset.purchase_date ? new Date(newAsset.purchase_date) : undefined} setDate={(date) => handleDateChange('purchase_date', date)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asset-warranty">Warranty Expiry Date</Label>
              <DatePicker date={newAsset.warranty_expiry_date ? new Date(newAsset.warranty_expiry_date) : undefined} setDate={(date) => handleDateChange('warranty_expiry_date', date)} />
            </div>
          </div>

          {/* Row 5: Expiry Date & Life Expectancy */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label htmlFor="asset-expiry-date">Expiry Date (e.g., Software)</Label>
               <DatePicker date={newAsset.expiry_date ? new Date(newAsset.expiry_date) : undefined} setDate={(date) => handleDateChange('expiry_date', date)} />
             </div>
             <div className="grid gap-2">
               <Label htmlFor="asset-life">Life Expectancy (Years)</Label>
               <Input id="asset-life" type="number" placeholder="e.g., 3" value={newAsset.life_expectancy_years ?? ''} onChange={(e) => handleChange('life_expectancy_years', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
             </div>
           </div>

          {/* Row 6: Invoice URL & Barcode URL */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label htmlFor="asset-invoice-url">Invoice URL</Label>
               <Input id="asset-invoice-url" placeholder="https://..." value={newAsset.invoice_url || ''} onChange={(e) => handleChange('invoice_url', e.target.value)} />
             </div>
             <div className="grid gap-2">
               <Label htmlFor="asset-barcode-url">Barcode URL</Label>
               <Input id="asset-barcode-url" placeholder="https://..." value={newAsset.barcode_url || ''} onChange={(e) => handleChange('barcode_url', e.target.value)} />
             </div>
           </div>

          {/* Row 7: YTD Usage */}
           <div className="grid gap-2">
             <Label htmlFor="asset-ytd-usage">YTD Usage</Label>
             <Input id="asset-ytd-usage" placeholder="e.g., 50 hours, 1000km" value={newAsset.ytd_usage || ''} onChange={(e) => handleChange('ytd_usage', e.target.value)} />
           </div>

          {/* Row 8: Notes */}
          <div className="grid gap-2">
            <Label htmlFor="asset-notes">Notes</Label>
            <Textarea id="asset-notes" placeholder="Additional notes about the asset" value={newAsset.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} />
          </div>
          
          {/* Row 9: Admin Comments */}
          <div className="grid gap-2">
            <Label htmlFor="asset-admin-comments">Admin Comments</Label>
            <Textarea id="asset-admin-comments" placeholder="Internal comments" value={newAsset.admin_comments || ''} onChange={(e) => handleChange('admin_comments', e.target.value)} />
          </div>

          {/* Row 10: Image Upload */}
          <div className="grid gap-2">
             <FileUpload 
               onFileUpload={(url) => handleChange('image_url', url)} // Assuming FileUpload provides URL
               currentImage={newAsset.image_url}
               label="Asset Image"
             />
          </div>
          
          {/* Specifications could be a JSON editor or dynamic fields - keeping simple for now */}
          {/* <div className="grid gap-2">
            <Label>Specifications (JSON)</Label>
            <Textarea 
              value={JSON.stringify(newAsset.specifications || {}, null, 2)}
              onChange={(e) => {
                try { handleChange('specifications', JSON.parse(e.target.value)); } catch {}
              }}
              rows={4}
            />
          </div> */} 

        </div>
        
        {/* ChecklistSection removed based on schema analysis */}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseAndReset}>Cancel</Button>
          <Button onClick={handleAddAsset}>Add Asset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetModal; 