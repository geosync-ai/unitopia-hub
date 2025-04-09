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
import { Task } from '@/types';
import { toast } from "@/components/ui/use-toast";

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskChange: (task: Task) => void;
  onSave: (task: Task) => void;
  allTasks: Task[];
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  open,
  onOpenChange,
  task,
  onTaskChange,
  onSave,
  allTasks
}) => {
  const handleSaveTask = () => {
    if (!task) return;
    
    if (!task.title) {
      toast({
        title: "Error",
        description: "Task title is required",
      });
      return;
    }
    
    // Check if it's a new task based on ID and existing tasks
    const isNewTask = task.id.includes('task-') && !allTasks.find(t => t.id === task.id);
    
    // Save the task
    onSave(task);
    
    // Close the modal
    onOpenChange(false);
    
    toast({
      title: isNewTask ? "Task Added" : "Task Updated",
      description: isNewTask 
        ? "The task has been successfully added" 
        : "The task has been successfully updated",
    });
  };

  if (!task) return null;

  const isNewEmptyTask = task.id.includes('task-') && !task.title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isNewEmptyTask ? 'Add New Task' : 'Edit Task'}</DialogTitle>
          <DialogDescription>
            {isNewEmptyTask ? 'Create a new task with the form below' : 'Make changes to the task details'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input 
              id="task-title" 
              placeholder="Task Title" 
              value={task.title || ''} 
              onChange={(e) => onTaskChange({...task, title: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea 
              id="task-description" 
              placeholder="Task Description" 
              value={task.description || ''} 
              onChange={(e) => onTaskChange({...task, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Input 
                id="task-assignee" 
                placeholder="Assignee" 
                value={task.assignee || ''} 
                onChange={(e) => onTaskChange({...task, assignee: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-status">Status</Label>
              <Select 
                value={task.status || 'todo'}
                onValueChange={(value: 'todo' | 'in-progress' | 'review' | 'done') => 
                  onTaskChange({...task, status: value})
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
                value={task.priority || 'medium'}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  onTaskChange({...task, priority: value})
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
                  value={task.completionPercentage || 0} 
                  onChange={(e) => onTaskChange({...task, completionPercentage: parseInt(e.target.value, 10)})}
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
                value={task.startDate instanceof Date ? task.startDate.toISOString().split('T')[0] : ''} 
                onChange={(e) => onTaskChange({...task, startDate: new Date(e.target.value)})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input 
                id="task-due-date" 
                type="date"
                value={typeof task.dueDate === 'string' ? task.dueDate : ''} 
                onChange={(e) => onTaskChange({...task, dueDate: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 mt-2">
          <ChecklistSection 
            items={task.checklist || []}
            onChange={(items) => onTaskChange({...task, checklist: items})}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveTask}>
            {isNewEmptyTask ? 'Add Task' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal; 