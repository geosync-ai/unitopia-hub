// src/components/kpi/KpiModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Kra, Kpi, User } from '@/types/kpi'; // Use the centralized types
import KraFormSection from './KraFormSection';
import KpiInputBlock from './KpiInputBlock';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from 'lucide-react';

interface KpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  kraData?: Kra | null; // Allow null for explicit clearing
  onSubmit: (formData: Kra) => void; // Function to handle form submission
  // Props needed for dropdowns/data fetching within the modal:
  users?: User[];
  objectives?: string[]; // Example: List of objectives
  units?: string[]; // Example: List of units/departments
}

const KpiModal: React.FC<KpiModalProps> = ({
  isOpen,
  onClose,
  kraData,
  onSubmit,
  users = [],
  objectives = [], // Provide default empty arrays
  units = [], // Provide default empty arrays
}) => {
  // Initialize state based on whether we are editing or adding
  const [formData, setFormData] = useState<Partial<Kra>>({});
  const [kpiBlocks, setKpiBlocks] = useState<Partial<Kpi>[]>([]);

  // Effect to reset form when kraData changes (for edit) or modal opens for add
  useEffect(() => {
    if (isOpen) {
      if (kraData) {
        // Editing existing KRA
        setFormData({ ...kraData });
        // Ensure KPI blocks are initialized correctly, including description and comments
        setKpiBlocks(kraData.kpis ? kraData.kpis.map(kpi => ({ ...kpi })) : [{}]);
      } else {
        // Adding new KRA - reset to defaults
        setFormData({
          title: '',
          objective: '',
          unit: '',
          startDate: '',
          targetDate: '',
          assignees: [],
          comments: '',
        });
        setKpiBlocks([{}]); // Start with one empty KPI block
      }
    } else {
      // Reset form when modal closes
      setFormData({});
      setKpiBlocks([]);
    }
  }, [isOpen, kraData]);

  const handleKraChange = useCallback((field: keyof Kra, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleKpiChange = useCallback((index: number, field: keyof Kpi, value: any) => {
    setKpiBlocks(prev => {
      const updatedBlocks = [...prev];
      updatedBlocks[index] = { ...updatedBlocks[index], [field]: value };
      return updatedBlocks;
    });
  }, []);

  const handleAddKpi = () => {
    // Add a new empty KPI object. Assign a temporary client-side key for React list rendering.
    setKpiBlocks(prev => [...prev, { tempId: `kpi_${Date.now()}` }]);
  };

  const handleRemoveKpi = (index: number) => {
    // TODO: Add confirmation if the KPI block has existing data (e.g., an ID from the backend)
    setKpiBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    // TODO: Add validation logic here
    const finalKpiBlocks = kpiBlocks.filter(kpi => kpi.name); // Filter out any completely empty blocks if needed
    const completeFormData = {
      ...formData,
      kpis: finalKpiBlocks,
    } as Kra; // Type assertion, ensure all required fields are present before submitting

    console.log("Modal Submit:", completeFormData);
    onSubmit(completeFormData);
    // onClose(); // onSubmit should handle closing via its own logic in KRAsTab
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{kraData ? 'Edit KRA' : 'Add New KRA'}</DialogTitle>
          <DialogDescription>
            {kraData ? 'Update the details for this Key Result Area and its KPIs.' : 'Create a new Key Result Area with its associated KPIs.'}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable middle section */}
        <div className="flex-1 overflow-y-auto pr-6 -mr-6 py-4">
          <div className="space-y-6">
            {/* Section 1: KRA Information */}
            <KraFormSection
              formData={formData}
              onChange={handleKraChange}
              users={users}
              objectives={objectives}
              units={units}
            />

            <Separator />

            {/* Section 2: Repeatable KPI Blocks */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">KPIs</h3>
              {kpiBlocks.map((kpi, index) => (
                <KpiInputBlock
                  key={kpi.id || kpi.tempId || index}
                  kpiIndex={index}
                  formData={kpi}
                  onChange={(field, value) => handleKpiChange(index, field, value)}
                  onRemove={handleRemoveKpi}
                  isOnlyBlock={kpiBlocks.length === 1}
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddKpi} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add KPI
              </Button>
            </div>
          </div>
        </div>

        {/* Footer remains fixed at the bottom */}
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={() => handleSubmit()}> 
            {kraData ? 'Save Changes' : 'Add KRA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KpiModal; 