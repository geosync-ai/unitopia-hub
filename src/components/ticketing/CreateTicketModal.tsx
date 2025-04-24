import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Staff {
  id: number;
  name: string;
  email: string;
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ 
  isOpen, 
  onClose,
  onTicketCreated 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [type, setType] = useState('support-request');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [requesterId, setRequesterId] = useState<number | null>(null);
  const [department, setDepartment] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);

  // Load staff list for assignee dropdown
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_members')
          .select('id, name, email')
          .order('name');

        if (error) {
          throw error;
        }

        if (data) {
          setStaff(data);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Failed to load staff list",
          description: "There was an error loading the staff list. Please try again.",
          variant: "destructive"
        });
      }
    };

    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen]);

  const generateTicketCode = () => {
    // Generate a code like SUPP-123
    const prefix = type === 'support-request' ? 'SUPP' : 
                  type === 'incident' ? 'INC' : 
                  type === 'problem' ? 'PROB' : 'SRQ';
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${random.toString().padStart(4, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First create the ticket
      const ticketCode = generateTicketCode();
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title,
          code: ticketCode,
          description,
          status: 'open',
          priority,
          assignee_id: assigneeId,
          requester_id: requesterId,
          department,
          type,
          due_date: dueDate
        })
        .select()
        .single();

      if (ticketError) {
        throw ticketError;
      }

      // Add an initial system message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          content: `Ticket created with ${priority} priority.`,
          created_by: requesterId,
          type: 'system-message'
        });

      if (messageError) {
        throw messageError;
      }

      toast({
        title: "Ticket Created",
        description: `Ticket ${ticketCode} has been created successfully.`,
      });

      // Reset form and close modal
      resetForm();
      onTicketCreated();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Failed to create ticket",
        description: "There was an error creating the ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setType('support-request');
    setAssigneeId(null);
    setRequesterId(null);
    setDepartment('');
    setDueDate(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      resetForm();
      onClose();
    }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Ticket Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Brief summary of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Ticket Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support-request">Support Request</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="problem">Problem</SelectItem>
                  <SelectItem value="service-request">Service Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department or unit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select value={assigneeId?.toString() || ''} onValueChange={(value) => setAssigneeId(Number(value) || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {staff.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requester">Requester</Label>
              <Select value={requesterId?.toString() || ''} onValueChange={(value) => setRequesterId(Number(value) || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select requester" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate || undefined}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Detailed description of the issue or request"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketModal; 