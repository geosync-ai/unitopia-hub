import React, { useState } from 'react';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';
import TicketDetailsPanel from './TicketDetailsPanel';
import { mockTickets, getTicketById } from './mockData';
import { Ticket } from './TicketList';

const TicketInbox: React.FC = () => {
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const handleTicketSelect = (ticket: Ticket) => {
    setActiveTicketId(ticket.id);
    setSelectedTicket(ticket);
  };

  return (
    <div className="flex h-full">
      <div className="w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <TicketList 
          tickets={mockTickets} 
          activeTicketId={activeTicketId}
          onTicketSelect={handleTicketSelect}
        />
      </div>
      <div className="flex-grow">
        <TicketDetail ticket={selectedTicket} />
      </div>
      <div className="w-72 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
        <TicketDetailsPanel ticket={selectedTicket} />
      </div>
    </div>
  );
};

export default TicketInbox; 