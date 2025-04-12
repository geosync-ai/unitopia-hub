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
import { Task } from '@/types';
import { toast } from "@/components/ui/use-toast";

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSubmit: (updatedTask: Partial<Task>) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  open,
  onOpenChange,
  task,
  onSubmit
}) => {
  const [editedTask, setEditedTask] = useState<Task>(task);

  // Update local state when the task prop changes
  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleSaveTask = () => {
    if (!editedTask.title) {
      toast({
        title: "Error",
        description: "Task title is required",
      });
      return;
    }
    
    // Save the task with the checklist included
    onSubmit(editedTask);
    
    // Close the modal
    onOpenChange(false);
    
    toast({
      title: "Task Updated",
      description: "The task has been successfully updated",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to the task details
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input 
              id="task-title" 
              placeholder="Task Title" 
              value={editedTask.title || ''} 
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea 
              id="task-description" 
              placeholder="Task Description" 
              value={editedTask.description || ''} 
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Input 
                id="task-assignee" 
                placeholder="Assignee" 
                value={editedTask.assignee || ''} 
                onChange={(e) => setEditedTask({...editedTask, assignee: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-status">Status</Label>
              <Select 
                value={editedTask.status || 'todo'}
                onValueChange={(value: 'todo' | 'in-progress' | 'review' | 'done') => 
                  setEditedTask({...editedTask, status: value})
                }
              >
                <SelectTrigger id="task-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select 
                value={editedTask.priority || 'medium'}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setEditedTask({...editedTask, priority: value})
                }
              >
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-percentage">Completion Percentage</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="task-percentage" 
                  type="number"
                  min="0"
                  max="100"
                  value={editedTask.completionPercentage || 0} 
                  onChange={(e) => setEditedTask({...editedTask, completionPercentage: parseInt(e.target.value, 10)})}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-start-date">Start Date</Label>
              <Input 
                id="task-start-date" 
                type="date"
                value={editedTask.startDate instanceof Date ? editedTask.startDate.toISOString().split('T')[0] : ''} 
                onChange={(e) => setEditedTask({...editedTask, startDate: new Date(e.target.value)})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input 
                id="task-due-date" 
                type="date"
                value={typeof editedTask.dueDate === 'string' ? editedTask.dueDate : ''} 
                onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 mt-2">
          <ChecklistSection 
            items={editedTask.checklist || []}
            onChange={(items) => setEditedTask({...editedTask, checklist: items})}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveTask}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal; 