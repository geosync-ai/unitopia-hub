import React from 'react';
import { CheckCircle, Clock, AlertCircle, MoreHorizontal } from 'lucide-react';

export interface Ticket {
  id: string;
  title: string;
  code: string;
  date: string;
  status: 'open' | 'to-do' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignees: string[];
}

interface TicketListProps {
  tickets: Ticket[];
  activeTicketId: string | null;
  onTicketSelect: (ticket: Ticket) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, activeTicketId, onTicketSelect }) => {
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

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">My Tickets</h2>
        <div className="flex items-center space-x-2">
          <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {tickets.map((ticket) => (
          <div 
            key={ticket.id}
            onClick={() => onTicketSelect(ticket)}
            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer p-4 ${
              activeTicketId === ticket.id ? 'bg-gray-100 dark:bg-gray-800' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{ticket.title}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{ticket.date}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate">{ticket.code}</span>
              <div className="flex items-center space-x-1">
                <span className="inline-flex items-center">
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1">{getStatusText(ticket.status)}</span>
                </span>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
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
              {ticket.priority === 'high' || ticket.priority === 'urgent' ? (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  ticket.priority === 'urgent' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketList; 