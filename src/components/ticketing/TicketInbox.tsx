import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TicketList from './TicketList';
import TicketCardView from './TicketCardView';
import TicketDetail from './TicketDetail';
import TicketDetailsPanel from './TicketDetailsPanel';
import CreateTicketModal from './CreateTicketModal';
import { Button } from '@/components/ui/button';
import { Filter, Plus } from 'lucide-react';

interface TicketInboxProps {
  viewMode: 'list' | 'grid';
}

const TicketInbox: React.FC<TicketInboxProps> = ({ viewMode }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchTickets();

    // Set up real-time subscription for tickets
    const subscription = supabase
      .channel('tickets-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTickets(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(ticket => 
            ticket.id === payload.new.id ? payload.new : ticket
          ));
          // If currently selected ticket is updated, update the selectedTicket
          if (selectedTicketId === payload.new.id) {
            setSelectedTicket(payload.new);
          }
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(ticket => ticket.id !== payload.old.id));
          // If deleted ticket is selected, clear selection
          if (selectedTicketId === payload.old.id) {
            setSelectedTicketId(null);
            setSelectedTicket(null);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      setSelectedTicket(ticket || null);
    } else {
      setSelectedTicket(null);
    }
  }, [selectedTicketId, tickets]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assignee:assignee_id(id, name, email),
          requester:requester_id(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketId(ticketId === selectedTicketId ? null : ticketId);
  };

  const handleCreateTicket = () => {
    setCreateModalOpen(true);
  };

  const handleTicketCreated = () => {
    fetchTickets();
    setCreateModalOpen(false);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <div className="w-full lg:w-7/12 xl:w-8/12 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ticket Inbox</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm" onClick={handleCreateTicket}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'list' ? (
            <TicketList 
              tickets={tickets} 
              selectedTicketId={selectedTicketId} 
              onTicketSelect={handleTicketSelect}
              loading={loading}
            />
          ) : (
            <TicketCardView 
              tickets={tickets} 
              selectedTicketId={selectedTicketId} 
              onTicketSelect={handleTicketSelect}
              loading={loading}
            />
          )}
        </div>
      </div>
      
      <div className="hidden lg:flex lg:w-5/12 xl:w-4/12 h-full flex-col overflow-hidden">
        <TicketDetail 
          ticketId={selectedTicketId}
          onStatusChange={fetchTickets}
        />
      </div>

      <CreateTicketModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
};

export default TicketInbox; 