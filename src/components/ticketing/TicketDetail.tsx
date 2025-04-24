import React, { useEffect, useState } from 'react';
import { User, MessageSquare, Calendar, Tag, Clock, CircleAlert, Paperclip, Users, X, ArrowDown, Bold, Italic, Underline, Link, Image, Code } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format } from 'date-fns';
import { Ticket } from './TicketList';
import { supabase } from '@/lib/supabaseClient';
import { Textarea } from '@/components/ui/textarea';
import TicketMessages from './TicketMessages';

interface TicketDetailProps {
  ticketId: string | null;
  onClose: () => void;
  ticket?: Ticket;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onClose, ticket }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('public-reply');
  const [currentUserId, setCurrentUserId] = useState<number>(1); // Mock user ID for now
  const [newMessage, setNewMessage] = useState('');
  const [messages] = useState<Message[]>([]); // Mock messages for the ticket
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    const fetchTicket = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            requester:requester_id(id, name, email),
            assignee:assignee_id(id, name, email)
          `)
          .eq('id', ticketId)
          .single();

        if (error) {
          console.error('Error fetching ticket:', error);
          return;
        }

        // Assuming data is of type Ticket
        // You might want to update the type to match your actual Ticket type
        // For example, if your Ticket type is different, you might want to cast it
        // const ticket = data as Ticket;
        // setTicket(ticket);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();

    // Set up real-time subscription for this specific ticket
    const subscription = supabase
      .channel(`ticket-${ticketId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `id=eq.${ticketId}`
      }, (payload) => {
        console.log('Change received!', payload);
        // Refresh the ticket data
        fetchTicket();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate sending message
    setTimeout(() => {
      setNewMessage('');
      setIsSubmitting(false);
    }, 500);
  };

  const renderAttachments = (attachments: any[]) => {
    if (!attachments || attachments.length === 0) return null;
    
    return (
      <div className="ml-11 mt-2 flex flex-wrap gap-2">
        {attachments.map((attachment, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded px-3 py-1.5 text-xs"
          >
            <div className="text-gray-600 dark:text-gray-400">
              {attachment.name}
            </div>
            <div className="text-gray-500 dark:text-gray-500">
              {format(new Date(attachment.date), 'dd MMM yyyy, h:mm a')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!ticketId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No ticket selected</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a ticket from the list to view its details
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40 mb-6" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <CircleAlert className="h-12 w-12 mx-auto text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Ticket not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The requested ticket could not be found or you don't have permission to view it
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700">
      {/* Ticket Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
          <div>
          <div className="flex items-center mb-0.5">
            <span className="text-sm text-gray-500 font-mono mr-2">{ticket?.code}</span>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {ticket?.title}
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            Created {format(new Date(ticket?.created_at || ''), 'MM/dd/yyyy HH:mm')} PST
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Message Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white dark:bg-gray-900">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <Tabs defaultValue="public-reply" value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="public-reply">Public Reply</TabsTrigger>
                    <TabsTrigger value="private-comment">Private Comment</TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
                </div>
                </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'public-reply' && (
                <div className="flex items-center mb-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">To:</div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${ticket?.requester?.name}`} />
                      <AvatarFallback>{getInitials(ticket?.requester?.name || '')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{ticket?.requester?.name} &lt;{ticket?.requester?.email}&gt;</span>
                    <button className="ml-1 text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                      </svg>
                    </button>
                </div>
                </div>
              )}
              
              <div className="space-y-6">
                {messages.map(message => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.creator?.name}`} />
                        <AvatarFallback>{message.creator ? getInitials(message.creator.name) : 'UN'}</AvatarFallback>
                    </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                    <div>
                            <div className="font-medium">{message.creator?.name}</div>
                            <div className="text-xs text-gray-500">
                              To: {ticket?.requester?.name} &lt;{ticket?.requester?.email}&gt;
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                            <button className="ml-2 text-gray-400 hover:text-gray-600">
                              <ArrowDown size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-gray-700 dark:text-gray-300">
                          {message.content}
                        </div>
                        {message.attachments && renderAttachments(message.attachments)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700">
              <Textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Add a reply..."
                className="min-h-[120px] border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              
              <div className="px-3 py-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center space-x-2">
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Bold">
                    <Bold className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Italic">
                    <Italic className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Underline">
                    <Underline className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Link">
                    <Link className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Image">
                    <Image className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Code">
                    <Code className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Attachment">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-2">
                    <Badge variant="outline" className="cursor-pointer">Add to KB</Badge>
                  </div>
                  <Button onClick={handleSubmit} disabled={!newMessage.trim() || isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </Button>
                </div>
                    </div>
                  </div>
          </div>
          </div>

        {/* Right sidebar for ticket details */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Priority</h3>
            <div className="mb-6">
              <div className="flex items-center">
                <div className="flex items-center w-6 h-6 rounded-full bg-green-100 justify-center text-green-800 dark:bg-green-900 dark:text-green-300">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                </div>
                <span className="ml-2 text-gray-700 dark:text-gray-300">{ticket?.priority.charAt(0).toUpperCase() + ticket?.priority.slice(1)}</span>
                <svg className="ml-auto h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Assigned To</h3>
            <div className="mb-6">
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${ticket?.assignee?.name}`} />
                  <AvatarFallback>{getInitials(ticket?.assignee?.name || '')}</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-gray-700 dark:text-gray-300">{ticket?.assignee?.name}</span>
                <svg className="ml-auto h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Project</h3>
            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-gray-700 dark:text-gray-300">Administrative</span>
                <svg className="ml-auto h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Ticket Type</h3>
            <div className="mb-6">
              <div className="flex items-center">
                <div className="flex items-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1">Task</span>
                </div>
                <svg className="ml-auto h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Due Date</h3>
            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-gray-700 dark:text-gray-300">mm/dd/yyyy</span>
                <svg className="ml-auto h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Reporter</h3>
            <div className="mb-6">
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${ticket?.requester?.name}`} />
                  <AvatarFallback>{getInitials(ticket?.requester?.name || '')}</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-gray-700 dark:text-gray-300">{ticket?.requester?.name}</span>
                <svg className="ml-auto h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Tags</h3>
            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-blue-600">Add Tag</span>
                <svg className="ml-1 h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="flex items-center justify-between font-medium text-gray-700 dark:text-gray-300 mb-4">
                <span>TASKS</span>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </h3>
              </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="flex items-center justify-between font-medium text-gray-700 dark:text-gray-300 mb-4">
                <span>COLLECTED FIELDS</span>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </h3>
                  </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="flex items-center justify-between font-medium text-gray-700 dark:text-gray-300 mb-4">
                <span>LINKED TICKETS</span>
                <div className="flex items-center">
                  <span className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 mr-2">2</span>
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </h3>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="flex items-center justify-between font-medium text-gray-700 dark:text-gray-300 mb-4">
                <span>HISTORY</span>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </h3>
            </div>
          </div>
          </div>
      </div>
    </div>
  );
};

export default TicketDetail; 