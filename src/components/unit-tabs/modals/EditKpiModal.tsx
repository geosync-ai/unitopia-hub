import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { KPI } from '@/types';

interface EditKpiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: (KPI & { kraId?: string });
  setKpi: React.Dispatch<React.SetStateAction<(KPI & { kraId?: string }) | null>>;
  onSubmit: () => void;
}

const EditKpiModal: React.FC<EditKpiModalProps> = ({
  open,
  onOpenChange,
  kpi,
  setKpi,
  onSubmit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit KPI</DialogTitle>
          <DialogDescription>
            Update the Key Performance Indicator details
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="kpi-name">Name</Label>
            <Input 
              id="kpi-name" 
              placeholder="KPI Name" 
              value={kpi.name} 
              onChange={(e) => setKpi({...kpi, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kpi-start-date">Start Date</Label>
              <Input 
                id="kpi-start-date" 
                type="date"
                value={kpi.startDate.toISOString().split('T')[0]} 
                onChange={(e) => setKpi({...kpi, startDate: new Date(e.target.value)})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="kpi-date">Evaluation Date</Label>
              <Input 
                id="kpi-date" 
                type="date"
                value={kpi.date.toISOString().split('T')[0]} 
                onChange={(e) => setKpi({...kpi, date: new Date(e.target.value)})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kpi-target">Target</Label>
              <Input 
                id="kpi-target" 
                placeholder="Target Value" 
                value={kpi.target} 
                onChange={(e) => setKpi({...kpi, target: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="kpi-actual">Actual</Label>
              <Input 
                id="kpi-actual" 
                placeholder="Actual Value" 
                value={kpi.actual} 
                onChange={(e) => setKpi({...kpi, actual: e.target.value})}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="kpi-status">Status</Label>
            <Select 
              defaultValue={kpi.status}
              onValueChange={(value: 'on-track' | 'at-risk' | 'behind' | 'completed') => {
                setKpi({...kpi, status: value});
              }}
            >
              <SelectTrigger id="kpi-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on-track">On Track</SelectItem>
                <SelectItem value="at-risk">At Risk</SelectItem>
                <SelectItem value="behind">Behind</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="kpi-description">Description</Label>
            <Textarea 
              id="kpi-description" 
              placeholder="Description" 
              value={kpi.description} 
              onChange={(e) => setKpi({...kpi, description: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="kpi-notes">Notes</Label>
            <Textarea 
              id="kpi-notes" 
              placeholder="Additional notes" 
              value={kpi.notes} 
              onChange={(e) => setKpi({...kpi, notes: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditKpiModal; 