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

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (task: Task) => void;
  allTasks: Task[];
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  open,
  onOpenChange,
  onAddTask,
  allTasks
}) => {
  const [newTask, setNewTask] = useState<Task>({
    id: `task-${Date.now()}`,
    title: '',
    description: '',
    assignee: '',
    status: 'todo',
    priority: 'medium',
    completionPercentage: 0,
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

    // Add the task
    onAddTask(newTask);
    
    // Reset form and close modal
    setNewTask({
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      assignee: '',
      status: 'todo',
      priority: 'medium',
      completionPercentage: 0,
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
              <Input 
                id="task-assignee" 
                placeholder="Assignee" 
                value={newTask.assignee} 
                onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
              />
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
                  min="0"
                  max="100"
                  value={newTask.completionPercentage || 0} 
                  onChange={(e) => setNewTask({...newTask, completionPercentage: parseInt(e.target.value, 10)})}
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