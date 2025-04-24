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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, User, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

// Define the shape of a comment
interface Comment {
  id: string;
  authorName: string;
  authorAvatarFallback: string;
  timestamp: Date;
  text: string;
}

// Define the shape of a ticket (can be expanded)
export interface TicketData {
  id?: string; // Optional for new tickets
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: string; // e.g., 'todo', 'inprogress', 'done'
  dueDate?: Date | null;
  assigneeId?: string | null; // ID of the assigned user
  comments?: Comment[]; // Added comments array
  // Add other relevant fields: reporterId, etc.
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
  const [comments, setComments] = useState<Comment[]>([]); // State for comments
  const [newCommentText, setNewCommentText] = useState(''); // State for new comment input
  
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'Medium');
      setStatus(initialData.status || 'todo');
      setDueDate(initialData.dueDate || undefined);
      setComments(initialData.comments || []); // Load existing comments
    } else {
      // Reset form for new ticket
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('todo');
      setDueDate(undefined);
      setComments([]); // Reset comments for new ticket
    }
    setNewCommentText(''); // Clear comment input on open/change
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
      comments: comments, // Note: comments are managed locally in this example
    };
    onSubmit(ticketData);
  };

  // Function to handle adding a new comment
  const handleAddComment = () => {
    if (!newCommentText.trim()) return; // Don't add empty comments

    // Replace with actual logged-in user data later
    const currentUser = { name: "Current User", avatarFallback: "CU" }; 

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorName: currentUser.name,
      authorAvatarFallback: currentUser.avatarFallback,
      timestamp: new Date(),
      text: newCommentText,
    };

    setComments(prevComments => [...prevComments, newComment]);
    setNewCommentText(''); // Clear input field
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
        <form onSubmit={handleSubmit} id="ticket-form">
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
        </form>

        <hr className="my-4" /> 
        <div>
          <h3 className="text-lg font-medium mb-4">Comments</h3>
          <ScrollArea className="h-[200px] w-full mb-4 border rounded-md p-2">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      {/* <AvatarImage src={comment.authorAvatarUrl} /> */}
                      <AvatarFallback>{comment.authorAvatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{comment.authorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(comment.timestamp, "PPp")} 
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2">
            <Textarea 
              placeholder="Add a comment..." 
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button type="button" size="icon" onClick={handleAddComment} disabled={!newCommentText.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send comment</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-6"> 
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="ticket-form">{initialData ? 'Save Changes' : 'Create Ticket'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDialog;