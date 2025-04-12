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
import ChecklistSection from '@/components/ChecklistSection';
import { Task } from '@/types';
import { toast } from "@/components/ui/use-toast";
import { useStaffByDivision } from '@/hooks/useStaffByDivision';

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<Task, 'id'>) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const { staffMembers, loading } = useStaffByDivision();
  
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    assignee: '',
    status: 'todo',
    priority: 'medium',
    completionPercentage: 1,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startDate: new Date(),
    checklist: [],
  });

  const handleAddTask = () => {
    if (!newTask.title) {
      toast({
        title: "Error",
        description: "Task title is required",
      });
      return;
    }
    
    // Create a copy with properly formatted dates
    const taskToSubmit = {
      ...newTask,
      // Ensure dueDate is a string
      dueDate: typeof newTask.dueDate === 'string' 
        ? newTask.dueDate 
        : (newTask.dueDate as Date)?.toISOString?.()?.split('T')[0] || null,
      
      // Ensure startDate is a proper date object or null
      startDate: newTask.startDate instanceof Date 
        ? newTask.startDate 
        : typeof newTask.startDate === 'string' && newTask.startDate 
          ? new Date(newTask.startDate) 
          : null
    };
    
    // Add the task - keep the checklist property now that we're adding it to the database
    onSubmit(taskToSubmit);
    
    // Reset form and close modal
    setNewTask({
      title: '',
      description: '',
      assignee: '',
      status: 'todo',
      priority: 'medium',
      completionPercentage: 1,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startDate: new Date(),
      checklist: [],
    });
    onOpenChange(false);
    
    toast({
      title: "Task Added",
      description: "The task has been successfully added",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task with the form below
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input 
              id="task-title" 
              placeholder="Task Title" 
              value={newTask.title} 
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea 
              id="task-description" 
              placeholder="Task Description" 
              value={newTask.description} 
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Select 
                value={newTask.assignee}
                onValueChange={(value) => setNewTask({...newTask, assignee: value})}
              >
                <SelectTrigger id="task-assignee" className={loading ? "opacity-50" : ""}>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="_loading">Loading staff members...</SelectItem>
                  ) : staffMembers && staffMembers.length > 0 ? (
                    staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.email}>
                        {staff.name} ({staff.job_title})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_no_staff">No staff members found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-status">Status</Label>
              <Select 
                value={newTask.status}
                onValueChange={(value: 'todo' | 'in-progress' | 'review' | 'done') => 
                  setNewTask({...newTask, status: value})
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
                value={newTask.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setNewTask({...newTask, priority: value})
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
                  min="1"
                  max="100"
                  value={newTask.completionPercentage || 1} 
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setNewTask({...newTask, completionPercentage: value < 1 ? 1 : value});
                  }}
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
                value={newTask.startDate instanceof Date ? newTask.startDate.toISOString().split('T')[0] : ''} 
                onChange={(e) => setNewTask({...newTask, startDate: new Date(e.target.value)})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input 
                id="task-due-date" 
                type="date"
                value={typeof newTask.dueDate === 'string' ? newTask.dueDate : ''}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 mt-2">
          <ChecklistSection 
            items={newTask.checklist || []}
            onChange={(items) => setNewTask({...newTask, checklist: items})}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddTask}>Add Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal; 