import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TicketList from './TicketList';
import TicketCardView from './TicketCardView';
import TicketDetail from './TicketDetail';
import CreateTicketModal from './CreateTicketModal';
import { Button } from '@/components/ui/button';
import { Filter, Plus, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ticket } from './TicketList';

interface TicketInboxProps {
  viewMode: 'list' | 'grid';
}

const TicketInbox: React.FC<TicketInboxProps> = ({ viewMode: initialViewMode }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(initialViewMode);

  // Mock data for initial development
  const mockTickets = [
    {
      id: '1',
      title: 'Laudantium neque veritatis',
      status: 'open',
      priority: 'medium',
      created_at: '2022-11-22T02:30:00Z',
      updated_at: '2022-11-22T02:30:00Z',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      requester: {
        id: '1',
        name: 'Allison Wescott',
        email: 'awescott@example.com'
      },
      assignee: {
        id: '2',
        name: 'Allie Harmon',
        email: 'aharmon@example.com'
      }
    },
    {
      id: '2',
      title: 'Soluta quam velit',
      status: 'in progress',
      priority: 'high',
      created_at: '2022-11-20T14:45:00Z',
      updated_at: '2022-11-21T10:15:00Z',
      description: 'Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper.',
      requester: {
        id: '3',
        name: 'John Smith',
        email: 'jsmith@example.com'
      },
      assignee: null
    },
    {
      id: '3',
      title: 'Molestiae saepe illum',
      status: 'resolved',
      priority: 'low',
      created_at: '2022-11-18T09:30:00Z',
      updated_at: '2022-11-19T16:45:00Z',
      description: 'Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat.',
      requester: {
        id: '4',
        name: 'Emma Wilson',
        email: 'ewilson@example.com'
      },
      assignee: {
        id: '2',
        name: 'Allie Harmon',
        email: 'aharmon@example.com'
      }
    },
    {
      id: '4',
      title: 'Dignissimos maiores porro',
      status: 'closed',
      priority: 'medium',
      created_at: '2022-11-15T11:20:00Z',
      updated_at: '2022-11-16T14:30:00Z',
      description: 'Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming.',
      requester: {
        id: '5',
        name: 'Michael Brown',
        email: 'mbrown@example.com'
      },
      assignee: {
        id: '6',
        name: 'Sarah Johnson',
        email: 'sjohnson@example.com'
      }
    },
    {
      id: '5',
      title: 'Nisi porro repudiandae',
      status: 'open',
      priority: 'high',
      created_at: '2022-11-12T08:15:00Z',
      updated_at: '2022-11-13T09:45:00Z',
      description: 'Typi non habent claritatem insitam; est usus legentis in iis qui facit eorum claritatem.',
      requester: {
        id: '7',
        name: 'David Lee',
        email: 'dlee@example.com'
      },
      assignee: null
    }
  ];

  useEffect(() => {
    // Use mock data for now
    setTickets(mockTickets);
    setLoading(false);
    
    // Will be replaced with actual API call later
    /*
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
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(ticket => ticket.id !== payload.old.id));
          if (selectedTicketId === payload.old.id) {
            setSelectedTicketId(null);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
    */
  }, []);

  useEffect(() => {
    // When a ticket is selected, hide the sidebar (on mobile/tablet)
    if (selectedTicketId && window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  }, [selectedTicketId]);

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
    // Will be replaced with actual API call later
    // fetchTickets();
    setCreateModalOpen(false);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Top action bar */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
          {!showSidebar && selectedTicketId && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2 md:hidden" 
              onClick={toggleSidebar}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">My Tickets</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleViewMode} className="hidden md:flex">
            {viewMode === 'list' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
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
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Ticket list panel */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out",
            selectedTicketId && !showSidebar 
              ? "w-0 opacity-0 max-w-0" 
              : "w-full lg:w-1/2 xl:w-2/5 opacity-100 max-w-full"
          )}
        >
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
        
        {/* Ticket detail panel */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out absolute inset-0 lg:relative bg-white dark:bg-gray-900",
            selectedTicketId && !showSidebar
              ? "translate-x-0 opacity-100 w-full z-10"
              : "translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100 lg:w-1/2 xl:w-3/5 -z-10 lg:z-0"
          )}
        >
          {selectedTicketId && <TicketDetail ticketId={selectedTicketId} />}
        </div>

        {/* Overlay for mobile to show the back button when a ticket is selected */}
        {selectedTicketId && !showSidebar && (
          <div 
            className="fixed top-0 left-0 lg:hidden z-20 m-4"
            onClick={toggleSidebar}
          >
            <Button variant="secondary" size="sm" className="rounded-full shadow-md">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}
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