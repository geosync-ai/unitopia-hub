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
import TicketDetailsPanel from './TicketDetailsPanel';

interface TicketCardViewProps {
  tickets: Ticket[];
}

const TicketCardView: React.FC<TicketCardViewProps> = ({ tickets }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const getStatusIcon = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'to-do':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'to-do':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const getPriorityClass = (priority: Ticket['priority']) => {
    switch (priority) {
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

  return (
    <div className="h-full">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">My Tickets</h2>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
        {tickets.map((ticket) => (
          <div 
            key={ticket.id}
            onClick={() => handleTicketSelect(ticket)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{ticket.title}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{ticket.date}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span className="truncate">{ticket.code}</span>
              <div className="flex items-center space-x-1">
                <span className="inline-flex items-center">
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1">{getStatusText(ticket.status)}</span>
                </span>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <div className="flex -space-x-2">
                {ticket.assignees.map((assignee, index) => (
                  <div 
                    key={index}
                    className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-700"
                    title={assignee}
                  >
                    {assignee.charAt(0)}
                  </div>
                ))}
              </div>
              {ticket.priority && (
                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
              )}
            </div>
          </div>
        ))}
        
        {tickets.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8">
            <p className="text-gray-500 dark:text-gray-400 text-center">Select a ticket to view details</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>
                  {selectedTicket?.code} | {selectedTicket?.title}
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
          
          <div className="flex h-[80vh] overflow-hidden">
            <div className="flex-grow overflow-y-auto">
              {selectedTicket && <TicketDetail ticket={selectedTicket} />}
            </div>
            <div className="w-72 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 overflow-y-auto">
              {selectedTicket && <TicketDetailsPanel ticket={selectedTicket} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketCardView; 