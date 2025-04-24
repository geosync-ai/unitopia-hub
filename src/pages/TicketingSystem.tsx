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
  MailOpen,
  FileText,
  Pencil,
  MoreHorizontal,
  X,
  Send,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Paperclip,
  BookOpen,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Settings2
} from 'lucide-react';

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
  
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const renderTicketsContent = () => (
    <div id="main-content-tickets" className="main-content-section active overflow-y-auto h-full">
      <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Technical Support Request</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">IT - 102 (10066951) | Created 11/14/22 12:32 PST</p>
        </div>
        <div className="flex items-center space-x-2">
          <button title="Mark as Read/Unread" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <MailOpen className="w-5 h-5" />
          </button>
          <button title="Use Template" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <FileText className="w-5 h-5" />
          </button>
          <button title="Edit Ticket" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <Pencil className="w-5 h-5" />
          </button>
          <button title="More Actions" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <span title="Assigned User" className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-medium">AU</span>
          <button className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center space-x-1">
            <span>To Do</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <button title="Close" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-1 mb-3 border-b border-gray-200 dark:border-gray-700">
          <button className="px-3 py-2 text-sm font-medium text-primary border-b-2 border-primary">Public Reply</button>
          <button className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600">Private Comment</button>
          <button className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600">Notes</button>
        </div>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400">
            To:
            <span className="inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 ml-1">
              User &lt;user@email.com&gt;
              <button className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <X className="w-3 h-3" />
              </button>
            </span>
            <span className="float-right text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 cursor-pointer">Cc/Bcc</span>
          </div>
          <textarea 
            placeholder="Add a reply... Type '/' for templates or actions." 
            rows={4} 
            className="w-full p-4 text-sm focus:outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <div className="flex space-x-1 items-center">
              <button title="Bold" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Bold className="w-4 h-4" />
              </button>
              <button title="Italic" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Italic className="w-4 h-4" />
              </button>
              <button title="Bulleted List" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <List className="w-4 h-4" />
              </button>
              <button title="Numbered List" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <ListOrdered className="w-4 h-4" />
              </button>
              <button title="Link" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Link2 className="w-4 h-4" />
              </button>
              <button title="Attach File" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <div className="flex space-x-2 items-center">
              <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs flex items-center space-x-1">
                <BookOpen className="w-4 h-4" /> <span>Add to KB</span>
              </button>
              <button className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 flex items-center">
                Send <Send className="w-4 h-4 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow px-6 py-4 space-y-6 bg-gray-50 dark:bg-gray-900 h-full">
        <div className="flex space-x-3">
          <span title="Support Agent" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm font-medium flex-shrink-0">SA</span>
          <div className="flex-grow p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-medium text-gray-800 dark:text-gray-200">Support Agent</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Feb 9, 2023 10:31 AM</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">To User &lt;user@email.com&gt;</p>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>We've received your technical support request. Our team is working on resolving the issue. We'll provide updates as we make progress.</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2 flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 w-auto max-w-[200px] cursor-pointer hover:shadow-sm">
                <Paperclip className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="truncate font-medium">troubleshooting_guide.pdf</p>
                  <p className="text-gray-500 dark:text-gray-500 text-[11px]">16 Jun 2023, 1:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <span title="System Message" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium flex-shrink-0">
            <Settings2 className="w-5 h-5" />
          </span>
          <div className="flex-grow text-xs text-gray-500 dark:text-gray-400 italic py-2">
            Ticket status changed from <span className="font-medium text-orange-600 dark:text-orange-400">Open</span> to <span className="font-medium text-blue-600 dark:text-blue-400">To Do</span> by Support Agent.
            <span className="ml-2">Feb 9, 2023 10:30 AM</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'tickets':
        return renderTicketsContent();
      default:
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  const renderDetailsPanel = () => {
    switch (activeSection) {
      case 'tickets':
        return (
          <div id="details-panel-tickets" className="details-panel-section active flex flex-col h-full">
            <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">Ticket Details</h3>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                <select className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                  <option>Lowest</option>
                  <option>Low</option>
                  <option selected>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned To</label>
                <button className="w-full flex justify-between items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-left text-sm text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium flex-shrink-0">SA</span>
                    <span>Support Agent</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                <button className="mt-1 text-xs text-primary hover:underline">Assign to me</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Department</label>
                <select className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                  <option>-- Auto-Route --</option>
                  <option>IT Support</option>
                  <option selected>Technical Support</option>
                  <option>Operations</option>
                  <option>Facilities</option>
                  <option>Human Resources</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                <select className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                  <option>General Inquiry</option>
                  <option selected>Support Request</option>
                  <option>Task</option>
                  <option>Event Request</option>
                  <option>Feedback</option>
                  <option>Complaint</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                <input type="date" className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reporter</label>
                <div className="flex items-center space-x-2 px-1 py-1.5">
                  <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs font-medium flex-shrink-0">RU</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">Reporting User</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags</label>
                <div className="flex flex-wrap gap-1 mb-1">
                  <span className="inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Urgent <button className="ml-1 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                  </span>
                  <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900 rounded-full px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                    Technical <button className="ml-1 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                  </span>
                </div>
                <button className="w-full flex items-center px-3 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-left text-sm text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                  <PlusCircle className="w-4 h-4 mr-1" /> <span>Add Tag</span>
                </button>
              </div>
              <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 mt-5">
                <button className="w-full flex justify-between items-center py-1.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2">
                  <span>SUB-TASKS (3)</span> <ChevronDown className="w-4 h-4" />
                </button>
                <div className="pl-4 space-y-1 text-xs">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-green-500" /> Contact user
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Square className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Check system logs
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Square className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Prepare solution
                  </div>
                </div>
                <button className="w-full flex justify-between items-center py-1.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2">
                  <span>LINKED ITEMS (1)</span> <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full flex justify-between items-center py-1.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2">
                  <span>ACTIVITY HISTORY</span> <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-gray-500 dark:text-gray-400 italic">Select an item to view details</p>
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

      <aside className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden">
        {renderDetailsPanel()}
      </aside>
    </div>
  );
};

export default TicketingSystem; 