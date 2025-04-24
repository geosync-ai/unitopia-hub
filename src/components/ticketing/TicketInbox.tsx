import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TicketList from './TicketList';
import TicketCardView from './TicketCardView';
import TicketDetail from './TicketDetail';
import { Button } from '@/components/ui/button';
import { 
  Filter, 
  ArrowLeft, 
  PanelLeftOpen, 
  PanelLeftClose, 
  ChevronLeft, 
  ChevronRight,
  Pin,
  PinOff,
  LayoutGrid,
  List,
  TicketIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ticket } from './TicketList';

interface TicketInboxProps {
  viewMode: 'list' | 'grid';
}

const TicketInbox: React.FC<TicketInboxProps> = ({ viewMode: initialViewMode }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [sidebarHoverEffect, setSidebarHoverEffect] = useState(false);
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
    // When a ticket is selected, hide the sidebar (on mobile/tablet) if not pinned
    if (selectedTicketId && window.innerWidth < 1024 && !isPinned) {
      setShowSidebar(false);
    }
  }, [selectedTicketId, isPinned]);

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

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const togglePinSidebar = () => {
    setIsPinned(!isPinned);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Top action bar */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
          {!showSidebar && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2" 
              onClick={toggleSidebar}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ticket Management</h2>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleViewMode} 
            className="h-9 w-9"
          >
            {viewMode === 'list' ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Ticket sub-header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">My Tickets</span>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left sidebar - will be collapsible */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 absolute inset-y-0 left-0 z-20",
            showSidebar 
              ? isPinned 
                ? "w-56 md:w-64 translate-x-0" 
                : "w-56 md:w-64 translate-x-0"
              : "w-56 -translate-x-full",
            sidebarHoverEffect && !showSidebar ? "translate-x-0 shadow-xl" : ""
          )}
          onMouseEnter={() => !showSidebar && setSidebarHoverEffect(true)}
          onMouseLeave={() => setSidebarHoverEffect(false)}
        >
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <TicketIcon className="h-5 w-5 mr-2 text-primary" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">Ticketing System</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={toggleSidebar}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className={`px-2 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex items-center justify-center text-primary">1</div>
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">Ticket Inbox</span>
                </div>
              </div>
              <div className="px-2 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex items-center justify-center"></div>
                  <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">Visitor Management</span>
                </div>
              </div>
              <div className="px-2 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex items-center justify-center"></div>
                  <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">Appointments</span>
                </div>
              </div>
              <div className="px-2 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex items-center justify-center"></div>
                  <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">Mail & Packages</span>
                </div>
              </div>
              <div className="px-2 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex items-center justify-center"></div>
                  <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">General Inquiries / Calls</span>
                </div>
              </div>
              <div className="px-2 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex items-center justify-center"></div>
                  <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">Employee Support</span>
                </div>
              </div>
              <div className="px-2 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex items-center justify-center"></div>
                  <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">Event Prep</span>
                </div>
              </div>
              <div className="px-2 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex items-center justify-center"></div>
                  <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">Feedback & Complaints</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pin control */}
          <div className="absolute top-14 right-0 transform translate-x-1/2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              onClick={togglePinSidebar}
            >
              {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Toggle sidebar button if sidebar is hidden */}
        {!showSidebar && !sidebarHoverEffect && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-sm"
            onClick={toggleSidebar}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        
        {/* Main content area */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out flex flex-1 flex-col",
            showSidebar || sidebarHoverEffect 
              ? isPinned 
                ? "ml-56 md:ml-64" 
                : "ml-0 md:ml-0"
              : "ml-0"
          )}
        >
          {/* Ticket list */}
          <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-1 overflow-hidden">
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
          
          {/* Ticket detail panel - shown when a ticket is selected */}
          {selectedTicketId && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 z-30 flex flex-col overflow-hidden">
              <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mr-2" 
                  onClick={() => setSelectedTicketId(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to list
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TicketDetail ticketId={selectedTicketId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketInbox; 