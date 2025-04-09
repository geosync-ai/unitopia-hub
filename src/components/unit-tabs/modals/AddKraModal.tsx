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
import { KRA } from '@/types';
import { mockObjectives } from '@/data/mockData';

interface AddKraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newKra: Partial<KRA>;
  setNewKra: React.Dispatch<React.SetStateAction<Partial<KRA>>>;
  onSubmit: () => void;
}

const AddKraModal: React.FC<AddKraModalProps> = ({
  open,
  onOpenChange,
  newKra,
  setNewKra,
  onSubmit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New KRA</DialogTitle>
          <DialogDescription>
            Create a new Key Result Area with the form below
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kra-name">Name</Label>
              <Input 
                id="kra-name" 
                placeholder="KRA Name" 
                value={newKra.name || ''} 
                onChange={(e) => setNewKra({...newKra, name: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="kra-department">Department</Label>
              <Input 
                id="kra-department" 
                placeholder="Department" 
                value={newKra.department || ''} 
                onChange={(e) => setNewKra({...newKra, department: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kra-objective">Objective</Label>
              <Select 
                onValueChange={(value) => {
                  const objective = mockObjectives.find(o => o.id === value);
                  setNewKra({
                    ...newKra, 
                    objectiveId: value,
                    objectiveName: objective?.title || ''
                  });
                }}
              >
                <SelectTrigger id="kra-objective">
                  <SelectValue placeholder="Select an objective" />
                </SelectTrigger>
                <SelectContent>
                  {mockObjectives.map(objective => (
                    <SelectItem key={objective.id} value={objective.id}>
                      {objective.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="kra-responsible">Responsible Person</Label>
              <Input 
                id="kra-responsible" 
                placeholder="Responsible Person" 
                value={newKra.responsible || ''} 
                onChange={(e) => setNewKra({...newKra, responsible: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kra-start-date">Start Date</Label>
              <Input 
                id="kra-start-date" 
                type="date"
                value={newKra.startDate ? newKra.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                onChange={(e) => setNewKra({...newKra, startDate: new Date(e.target.value)})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="kra-end-date">End Date</Label>
              <Input 
                id="kra-end-date" 
                type="date"
                value={newKra.endDate ? newKra.endDate.toISOString().split('T')[0] : ''} 
                onChange={(e) => setNewKra({...newKra, endDate: new Date(e.target.value)})}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit}>Add KRA</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddKraModal; 