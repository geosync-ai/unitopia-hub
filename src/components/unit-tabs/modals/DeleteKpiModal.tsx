import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KPI } from '@/types';

interface DeleteKpiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: (KPI & { kraId?: string });
  onConfirm: () => void;
}

const DeleteKpiModal: React.FC<DeleteKpiModalProps> = ({
  open,
  onOpenChange,
  kpi,
  onConfirm
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Delete KPI</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this KPI? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="font-medium">{kpi.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
          <div className="mt-3 p-3 bg-muted/50 rounded-md">
            <div className="flex justify-between">
              <span className="text-sm">Target:</span>
              <span className="text-sm font-medium">{kpi.target}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm">Actual:</span>
              <span className="text-sm font-medium">{kpi.actual}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete KPI</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteKpiModal; 