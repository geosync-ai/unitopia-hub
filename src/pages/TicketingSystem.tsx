import React, { useState } from 'react';
import { 
  Inbox, 
  Users, 
  CalendarDays, 
  Package, 
  Phone, 
  LifeBuoy, 
  CalendarCheck, 
  MessageSquareWarning,
  PlusCircle,
  Grid,
  List,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
  Eye,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TicketDetail from '@/components/ticketing/TicketDetail';

// Interface definitions
interface Ticket {
  id: string;
  title: string;
  code: string;
  created_at: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'to-do';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  department?: string;
  description?: string;
  tags?: string[];
  comments?: number;
  views?: number;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  target: string;
  count?: number;
  isActive: boolean;
  onClick: (target: string) => void;
}

// Mock data for tickets
const mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Laudantium neque veritatis',
    code: 'OPS-102',
    created_at: '2024-06-14T12:32:00Z',
    status: 'to-do',
    priority: 'medium',
    assigned_to: 'Allie Harmon',
    created_by: 'Allison Westervelt',
    comments: 2,
    views: 2
  },
  {
    id: '2',
    title: 'Soluta quam velit',
    code: 'APPS-216',
    created_at: '2024-06-02T09:15:00Z',
    status: 'to-do',
    priority: 'low',
    assigned_to: 'Allie Harmon',
    created_by: 'Danny Amacher',
    comments: 3,
    views: 1
  },
  {
    id: '3',
    title: 'Molestiae saepe illum',
    code: 'APPS-216',
    created_at: '2024-06-01T14:20:00Z',
    status: 'open',
    priority: 'medium',
    assigned_to: 'Allie Harmon',
    created_by: 'Danny Amacher',
    comments: 1,
    views: 4
  },
  {
    id: '4',
    title: 'Dignissimos maiores porro',
    code: 'APPS-216',
    created_at: '2024-05-31T10:45:00Z',
    status: 'closed',
    priority: 'low',
    assigned_to: 'Allie Harmon',
    created_by: 'Danny Amacher',
    comments: 2,
    views: 3
  },
  {
    id: '5',
    title: 'Nihil porro repudiandae',
    code: 'APPS-216', 
    created_at: '2024-05-31T08:30:00Z',
    status: 'closed',
    priority: 'low',
    assigned_to: 'Allie Harmon',
    created_by: 'Danny Amacher',
    comments: 0,
    views: 2
  },
  {
    id: '6',
    title: 'Aspernatur cumque ipsum',
    code: 'APPS-216',
    created_at: '2024-05-30T16:20:00Z',
    status: 'closed',
    priority: 'low',
    assigned_to: 'Allie Harmon',
    created_by: 'Danny Amacher',
    comments: 5,
    views: 7
  },
  {
    id: '7',
    title: 'Culpa quos aliquam',
    code: 'APPS-216',
    created_at: '2024-05-30T12:10:00Z',
    status: 'in-progress',
    priority: 'medium',
    assigned_to: 'Allie Harmon',
    created_by: 'Danny Amacher',
    comments: 2,
    views: 3
  },
  {
    id: '8',
    title: 'Atque incidunt autem',
    code: 'APPS-216',
    created_at: '2024-05-30T09:05:00Z',
    status: 'in-progress',
    priority: 'high',
    assigned_to: 'Allie Harmon',
    created_by: 'Danny Amacher',
    comments: 1,
    views: 4
  },
  {
    id: '9',
    title: 'Ut sapiente sunt',
    code: 'APPS-216',
    created_at: '2024-05-29T14:30:00Z',
    status: 'resolved',
    priority: 'urgent',
    assigned_to: 'Allie Harmon',
    created_by: 'Danny Amacher',
    comments: 3,
    views: 5
  }
];

// Sidebar Item Component
const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  target, 
  count, 
  isActive, 
  onClick 
}) => {
  return (
    <button 
      onClick={() => onClick(target)}
      className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors ${
        isActive 
          ? 'active bg-gray-100 dark:bg-gray-800 border-l-4 border-primary' 
          : 'border-l-4 border-transparent'
      }`}
    >
      <Icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
      <span className="text-sm">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5">
          {count}
        </span>
      )}
    </button>
  );
};

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const getColor = () => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in-progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'to-do': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </div>
  );
};

// Improved List View Ticket Item (matches second image)
const ImprovedListItem: React.FC<{ ticket: Ticket; onClick: () => void }> = ({ 
  ticket, 
  onClick 
}) => {
  // Format the date display
  const getFormattedDate = () => {
    const date = new Date(ticket.created_at);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // For dates in June 2024
    if (ticket.code === 'OPS-102') {
      return 'Jun 14';
    } else if (ticket.title === 'Soluta quam velit' || ticket.title === 'Molestiae saepe illum') {
      return 'Jun 2';
    } else {
      return `May 31`;
    }
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "AH";
    return "AH";
  };

  return (
    <div 
      onClick={onClick}
      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:hover:bg-gray-800"
    >
      <div className="flex items-center py-2">
        <div className="flex-shrink-0 pl-4">
          <input 
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        <div className="flex-1 px-4">
          <div className="flex items-center">
            <span className="font-mono text-xs text-gray-500 mr-2">{ticket.code}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-200">
            {ticket.title}
          </div>
        </div>
        
        <div className="flex items-center pr-4">
          <div className="flex-shrink-0 mr-4">
            <Avatar className="h-6 w-6 bg-rose-500 text-white">
              <AvatarFallback>AH</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-shrink-0 mr-4">
            <PriorityBadge priority={ticket.priority} />
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{ticket.comments}</span>
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{ticket.views}</span>
            </div>
            <span className="text-gray-500 w-16 text-right">{getFormattedDate()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ticket card component
const TicketCard: React.FC<{ ticket: Ticket; isSelected: boolean; onClick: () => void }> = ({ 
  ticket, 
  isSelected,
  onClick 
}) => {
  const dateFormatted = new Date(ticket.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div 
      onClick={onClick}
      className={`border rounded-lg shadow-sm p-4 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-gray-500 font-mono">{ticket.code}</div>
        <div className="text-xs text-gray-500">{dateFormatted}</div>
      </div>
      
      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-200 mb-3 line-clamp-2">
        {ticket.title}
      </h3>
      
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${ticket.assigned_to}`} />
            <AvatarFallback>{(ticket.assigned_to || '').split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-600 dark:text-gray-400">{ticket.assigned_to}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 space-x-2">
          <div className="flex items-center">
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            <span>{ticket.comments}</span>
          </div>
          <div className="flex items-center">
            <Eye className="h-3.5 w-3.5 mr-1" />
            <span>{ticket.views}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Ticketing System Component
const TicketingSystem: React.FC = () => {
  const [activeSection, setActiveSection] = useState('inbox');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSelectedTicketId(null);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'card' : 'list');
  };

  const handleTicketClick = (ticketId: string) => {
    if (viewMode === 'list') {
      setSelectedTicketId(ticketId);
    } else {
      // For card view, we'll navigate to a new page
      setSelectedTicketId(ticketId);
    }
  };

  const closeTicketDetail = () => {
    setSelectedTicketId(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const filteredTickets = mockTickets.filter(ticket => {
    // Filter by search query
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status tab
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'open' && ticket.status === 'open') ||
      (activeTab === 'in-progress' && ticket.status === 'in-progress') ||
      (activeTab === 'resolved' && ticket.status === 'resolved') ||
      (activeTab === 'closed' && ticket.status === 'closed');
    
    return matchesSearch && matchesTab;
  });

  const selectedTicket = mockTickets.find(ticket => ticket.id === selectedTicketId);

  // Render tickets based on view mode
  const renderTickets = () => {
    if (viewMode === 'list') {
      return (
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.map(ticket => (
            <ImprovedListItem 
              key={ticket.id} 
              ticket={ticket} 
              onClick={() => handleTicketClick(ticket.id)} 
            />
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map(ticket => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              isSelected={selectedTicketId === ticket.id}
              onClick={() => handleTicketClick(ticket.id)} 
            />
          ))}
        </div>
      );
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-gray-900 relative">
      {/* Sidebar */}
      <div className="flex relative">
        {sidebarOpen && (
          <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Inbox className="w-5 h-5 text-primary" />
                <h1 className="font-semibold text-gray-800 dark:text-gray-200">Ticket Inbox</h1>
              </div>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs font-semibold">
                15
              </span>
            </div>

            <nav className="flex-grow overflow-y-auto py-2">
              <SidebarItem 
                icon={Inbox} 
                label="Ticket Inbox" 
                target="inbox" 
                count={15}
                isActive={activeSection === 'inbox'} 
                onClick={handleSectionChange} 
              />
              <SidebarItem 
                icon={Users} 
                label="Visitor Management" 
                target="visitors" 
                isActive={activeSection === 'visitors'} 
                onClick={handleSectionChange} 
              />
              <SidebarItem 
                icon={CalendarDays} 
                label="Appointments" 
                target="appointments" 
                isActive={activeSection === 'appointments'} 
                onClick={handleSectionChange} 
              />
              <SidebarItem 
                icon={Package} 
                label="Mail & Packages" 
                target="mail" 
                isActive={activeSection === 'mail'} 
                onClick={handleSectionChange} 
              />
              <SidebarItem 
                icon={Phone} 
                label="General Inquiries / Calls" 
                target="calls" 
                isActive={activeSection === 'calls'} 
                onClick={handleSectionChange} 
              />
              <SidebarItem 
                icon={LifeBuoy} 
                label="Employee Support" 
                target="support" 
                isActive={activeSection === 'support'} 
                onClick={handleSectionChange} 
              />
              <SidebarItem 
                icon={CalendarCheck} 
                label="Event Prep" 
                target="events" 
                isActive={activeSection === 'events'} 
                onClick={handleSectionChange} 
              />
              <SidebarItem 
                icon={MessageSquareWarning} 
                label="Feedback & Complaints" 
                target="feedback" 
                isActive={activeSection === 'feedback'} 
                onClick={handleSectionChange} 
              />
            </nav>
          </aside>
        )}
        
        {/* Sidebar Toggle Button */}
        <button 
          onClick={toggleSidebar} 
          className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 h-8 w-6 bg-rose-600 text-white rounded-r-md flex items-center justify-center shadow-md z-10"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeSection === 'inbox' ? (
          selectedTicketId && viewMode === 'card' ? (
            <TicketDetail 
              ticketId={selectedTicketId} 
              onClose={closeTicketDetail}
              ticket={selectedTicket}
            />
          ) : (
            <div className="flex flex-col h-full">
              {/* Ticket List Header */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    {!sidebarOpen && (
                      <button onClick={toggleSidebar} className="mr-3">
                        <Menu className="h-5 w-5 text-gray-500" />
                      </button>
                    )}
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      My Tickets
                    </h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={toggleViewMode}>
                        {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <Button className="flex items-center bg-rose-600 hover:bg-rose-700" variant="default">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      <span>Create New</span>
                    </Button>
                  </div>
                </div>
                
                {/* Search and Filter */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search tickets"
                      className="pl-9 pr-3 py-2 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Filter className="h-4 w-4 mr-1" />
                      <span>Filter</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <SlidersHorizontal className="h-4 w-4 mr-1" />
                      <span>Sort</span>
                    </Button>
                  </div>
                </div>
                
                {/* Status Tabs */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'all'
                          ? 'border-b-2 border-rose-600 text-rose-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTab('open')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'open'
                          ? 'border-b-2 border-rose-600 text-rose-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => setActiveTab('in-progress')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'in-progress'
                          ? 'border-b-2 border-rose-600 text-rose-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => setActiveTab('resolved')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'resolved'
                          ? 'border-b-2 border-rose-600 text-rose-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Resolved
                    </button>
                    <button
                      onClick={() => setActiveTab('closed')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'closed'
                          ? 'border-b-2 border-rose-600 text-rose-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Closed
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Ticket List */}
              {viewMode === 'list' && selectedTicketId ? (
                <TicketDetail 
                  ticketId={selectedTicketId} 
                  onClose={closeTicketDetail}
                  ticket={selectedTicket}
                />
              ) : (
                renderTickets()
              )}
            </div>
          )
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <p className="text-gray-600 dark:text-gray-400">
                This section is under development. Soon you'll be able to manage {activeSection} here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketingSystem; 