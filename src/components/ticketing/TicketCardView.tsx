import React, { useState } from 'react';
import { Ticket } from './TicketList';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import TicketDetail from './TicketDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface TicketCardViewProps {
  tickets: Ticket[];
  selectedTicketId?: string | null;
  onTicketSelect?: (ticketId: string) => void;
  loading?: boolean;
}

const TicketCardView: React.FC<TicketCardViewProps> = ({ 
  tickets, 
  selectedTicketId, 
  onTicketSelect, 
  loading = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTicketSelect = (ticketId: string) => {
    if (onTicketSelect) {
      onTicketSelect(ticketId);
    } else {
      // Fallback to modal view if no selection handler is provided
      const selectedTicket = tickets.find(t => t.id === ticketId);
      if (selectedTicket) {
        setIsModalOpen(true);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'in progress':
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'Open';
      case 'in-progress':
      case 'in progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <Skeleton className="h-5 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {tickets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8">
            <p className="text-gray-500 dark:text-gray-400 text-center">No tickets found</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div 
              key={ticket.id}
              onClick={() => handleTicketSelect(ticket.id)}
              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 ${
                selectedTicketId === ticket.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{ticket.title}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 truncate">
                {ticket.description ? ticket.description.substring(0, 60) + (ticket.description.length > 60 ? '...' : '') : 'No description'}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="inline-flex items-center">
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1">{getStatusText(ticket.status)}</span>
                </span>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div className="flex">
                  {ticket.assignee ? (
                    <div 
                      className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-700"
                      title={ticket.assignee.name}
                    >
                      {ticket.assignee.name.charAt(0)}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Unassigned</div>
                  )}
                </div>
                {ticket.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(ticket.priority)}`}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for viewing ticket details if no parent handler is provided */}
      {!onTicketSelect && selectedTicketId && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>
                    Ticket Details
                  </span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-grow overflow-y-auto p-4">
              <TicketDetail ticketId={selectedTicketId} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TicketCardView; 