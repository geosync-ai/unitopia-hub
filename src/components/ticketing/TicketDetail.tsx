import React, { useEffect, useState } from 'react';
import { User, MessageSquare, Calendar, Tag, Clock, CircleAlert, Paperclip, Users } from 'lucide-react';
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
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [currentUserId, setCurrentUserId] = useState<number>(1); // Mock user ID for now

  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
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

        setTicket(data);
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{ticket.title}</h2>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
              <span>#{ticket.id.slice(0, 8)}</span>
              <span>•</span>
              <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
              <span>•</span>
              <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-3 sm:grid-cols-4 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="attachments" className="hidden sm:block">Attachments</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <TabsContent value="details" className="p-6 space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Dates</span>
                </div>
              </CardHeader>
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Created</span>
                  <span className="text-sm">{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">Last Updated</span>
                  <span className="text-sm">{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Classification</span>
                </div>
              </CardHeader>
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">Priority</span>
                  <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Requester</span>
                </div>
              </CardHeader>
              <CardContent className="py-3 px-4">
                {ticket.requester ? (
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${ticket.requester.name}`} />
                      <AvatarFallback>{getInitials(ticket.requester.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{ticket.requester.name}</div>
                      <div className="text-xs text-gray-500">{ticket.requester.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No requester assigned</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Assignee</span>
                </div>
              </CardHeader>
              <CardContent className="py-3 px-4">
                {ticket.assignee ? (
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${ticket.assignee.name}`} />
                      <AvatarFallback>{getInitials(ticket.assignee.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{ticket.assignee.name}</div>
                      <div className="text-xs text-gray-500">{ticket.assignee.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">No assignee</span>
                    <Button variant="ghost" size="sm">Assign</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Description</span>
              </div>
            </CardHeader>
            <CardContent className="py-3 px-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {ticket.description ? (
                  <p className="whitespace-pre-wrap">{ticket.description}</p>
                ) : (
                  <p className="text-gray-500">No description provided</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="h-full mt-0">
          {ticketId && <TicketMessages ticketId={ticketId} currentUserId={currentUserId} />}
        </TabsContent>

        <TabsContent value="activity" className="p-6 mt-0">
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <h3 className="text-gray-700 dark:text-gray-300">Activity Log</h3>
              <p className="text-sm text-gray-500">
                View the history of all actions taken on this ticket
              </p>
            </div>

            <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 ml-4 space-y-6">
              <div className="relative">
                <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm font-medium">Ticket Created</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-sm mt-1">
                    Ticket was created by {ticket.requester?.name || "Unknown"}
                  </p>
                </div>
              </div>

              {ticket.updated_at !== ticket.created_at && (
                <div className="relative">
                  <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-yellow-500"></div>
                  <div>
                    <p className="text-sm font-medium">Ticket Updated</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.updated_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    <p className="text-sm mt-1">
                      Ticket was updated
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="p-6 mt-0">
          <div className="text-center py-8">
            <Paperclip className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Attachments</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There are no files attached to this ticket
            </p>
            <Button className="mt-4" variant="outline">
              <Paperclip className="mr-2 h-4 w-4" />
              Attach Files
            </Button>
          </div>
        </TabsContent>
      </div>
    </div>
  );
};

export default TicketDetail; 