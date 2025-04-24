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
} from 'lucide-react';
import TicketInbox from '../components/ticketing/TicketInbox';
import TicketCardView from '../components/ticketing/TicketCardView';
import { mockTickets } from '../components/ticketing/mockData';
import {
  VisitorManagement,
  Appointments,
  MailPackages,
  GeneralInquiries,
  EmployeeSupport,
  EventPrep,
  FeedbackComplaints
} from '../components/ticketing/PlaceholderContent';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  target: string;
  count?: number;
  isActive: boolean;
  onClick: (target: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  target, 
  count, 
  isActive, 
  onClick 
}) => {
  return (
    <a 
      href="#" 
      onClick={(e) => {
        e.preventDefault();
        onClick(target);
      }}
      className={`sidebar-item flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors ${
        isActive 
          ? 'active bg-gray-100 dark:bg-gray-800 border-l-4 border-primary' 
          : 'border-l-4 border-transparent'
      }`}
    >
      <Icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5">
          {count}
        </span>
      )}
    </a>
  );
};

const TicketingSystem: React.FC = () => {
  const [activeSection, setActiveSection] = useState('tickets');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'card' : 'list');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'tickets':
        return (
          <div className="flex flex-col h-full">
            <div className="border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Ticket Management
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={toggleViewMode}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
                <button 
                  onClick={toggleViewMode}
                  className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  title="Card View"
                >
                  <Grid className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-hidden">
              {viewMode === 'list' ? <TicketInbox /> : <TicketCardView tickets={mockTickets} />}
            </div>
          </div>
        );
      case 'visitors':
        return <VisitorManagement />;
      case 'appointments':
        return <Appointments />;
      case 'mail':
        return <MailPackages />;
      case 'calls':
        return <GeneralInquiries />;
      case 'support':
        return <EmployeeSupport />;
      case 'events':
        return <EventPrep />;
      case 'feedback':
        return <FeedbackComplaints />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-gray-800 dark:text-gray-200 text-base">Ticketing System</h1>
          </div>
        </div>

        <nav className="flex-grow overflow-y-auto py-2 space-y-1">
          <SidebarItem 
            icon={Inbox} 
            label="Ticket Inbox" 
            target="tickets" 
            count={15}
            isActive={activeSection === 'tickets'} 
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

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium">
            <PlusCircle className="w-5 h-5 mr-2" />
            <span>Create New</span>
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default TicketingSystem; 