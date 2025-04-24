import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Define the shape of a ticket (can be expanded)
export interface TicketData {
  id?: string; // Optional for new tickets
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: string; // e.g., 'todo', 'inprogress', 'done'
  dueDate?: Date | null;
  assigneeId?: string | null; // ID of the assigned user
  // Add other relevant fields: reporterId, comments, etc.
}

interface StatusOption {
  id: string;
  name: string;
}

interface TicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: TicketData) => void;
  initialData?: TicketData | null; // For editing
  statuses?: StatusOption[]; // Available status options
}

const TicketDialog: React.FC<TicketDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  statuses = [
    { id: 'todo', name: 'TO DO' },
    { id: 'inprogress', name: 'IN PROGRESS' },
    { id: 'done', name: 'DONE' }
  ]
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<string>('todo');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'Medium');
      setStatus(initialData.status || 'todo');
      setDueDate(initialData.dueDate || undefined);
    } else {
      // Reset form for new ticket
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('todo');
      setDueDate(undefined);
    }
  }, [initialData, isOpen]); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketData: TicketData = {
      id: initialData?.id, // Keep existing ID if editing
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
    };
    onSubmit(ticketData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Ticket' : 'Create New Ticket'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details of the ticket.' : 'Fill in the details for the new ticket.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="col-span-3" 
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="col-span-3" 
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((statusOption) => (
                    <SelectItem key={statusOption.id} value={statusOption.id}>
                      {statusOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select value={priority} onValueChange={(value: 'Low' | 'Medium' | 'High') => setPriority(value)}>
                <SelectTrigger id="priority" className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignee" className="text-right">
                Assignee
              </Label>
              <div className="col-span-3 flex items-center">
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  <span className="text-muted-foreground">Assign to a team member</span>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? 'Save Changes' : 'Create Ticket'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDialog;