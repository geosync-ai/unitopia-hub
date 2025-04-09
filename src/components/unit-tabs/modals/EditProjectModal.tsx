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
import { Project } from '@/types';
import { toast } from "@/components/ui/use-toast";
import DatePicker from '@/components/DatePicker';

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectChange: (project: Project) => void;
  onSave?: (project: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  open,
  onOpenChange,
  project,
  onProjectChange,
  onSave
}) => {
  
  // Don't render anything if project is null
  if (!project) {
    return null;
  }
  
  const handleSave = () => {
    if (!project.name) {
      toast({
        title: "Error",
        description: "Project name is required",
      });
      return;
    }

    if (!project.manager) {
      toast({
        title: "Error",
        description: "Project manager is required",
      });
      return;
    }

    // Save the project
    if (onSave) {
      onSave(project);
    }
    
    toast({
      title: "Success",
      description: "Project updated successfully",
    });
    
    // Close the modal
    onOpenChange(false);
  };

  const handleChange = (field: string, value: any) => {
    onProjectChange({
      ...project,
      [field]: value
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details using the form below
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-title">Project Name <span className="text-destructive">*</span></Label>
            <Input 
              id="project-title" 
              placeholder="Project Name" 
              value={project.name || ''} 
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea 
              id="project-description" 
              placeholder="Project Description" 
              value={project.description || ''} 
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-owner">Manager <span className="text-destructive">*</span></Label>
              <Input 
                id="project-owner" 
                placeholder="Project Manager" 
                value={project.manager || ''} 
                onChange={(e) => handleChange('manager', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-status">Status</Label>
              <Select 
                value={project.status || 'planned'}
                onValueChange={(value: 'planned' | 'in-progress' | 'completed' | 'on-hold') => 
                  handleChange('status', value)
                }
              >
                <SelectTrigger id="project-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-start-date">Start Date</Label>
              <DatePicker 
                date={project.startDate} 
                setDate={(date) => handleChange('startDate', date)} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-end-date">End Date</Label>
              <DatePicker 
                date={project.endDate} 
                setDate={(date) => handleChange('endDate', date)} 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-budget">Budget</Label>
            <Input 
              id="project-budget" 
              placeholder="Budget" 
              type="number"
              value={project.budget || ''} 
              onChange={(e) => handleChange('budget', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
        
        <div className="border-t pt-4 mt-2">
          <ChecklistSection 
            items={project.checklist || []}
            onChange={(items) => handleChange('checklist', items)}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectModal; 