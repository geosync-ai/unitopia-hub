import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  description: string;
  requester: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onTicketSelect: (ticketId: string) => void;
  loading: boolean;
}

const TicketList: React.FC<TicketListProps> = ({ 
  tickets, 
  selectedTicketId, 
  onTicketSelect,
  loading
}) => {
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

  if (loading) {
    return (
      <div className="overflow-y-auto h-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-2 mb-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {tickets.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">No tickets found</p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
              selectedTicketId === ticket.id ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
            }`}
            onClick={() => onTicketSelect(ticket.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{ticket.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Updated {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </Badge>
                  <Badge className={`${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>
              {ticket.assignee && (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${ticket.assignee.name}`} />
                  <AvatarFallback>{getInitials(ticket.assignee.name)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TicketList;
export type { Ticket }; 