import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketInbox from '@/components/ticketing/TicketInbox';
import TicketManager from '../components/ticketing/TicketManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeToggle from '@/components/layout/ThemeToggle';
import { 
  Ticket, 
  Users, 
  Calendar, 
  Mail, 
  Phone, 
  LifeBuoy, 
  CalendarDays, 
  MessageSquare,
  ArrowLeft,
  LayoutGrid,
  Plus,
  Bell,
  Kanban
} from 'lucide-react';
import { Button } from "@/components/ui/button";

type TicketCategory = 
  | 'ticket-inbox' 
  | 'ticket-manager'
  | 'visitor-management' 
  | 'appointments' 
  | 'mail-packages' 
  | 'general-inquiries' 
  | 'employee-support' 
  | 'event-prep' 
  | 'feedback-complaints';

const Tickets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TicketCategory>('ticket-inbox');
  const navigate = useNavigate();

  const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 min-h-[500px] rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{title} Content</h2>
    </div>
  );

  const tabs = [
    { 
      id: 'ticket-manager' as TicketCategory, 
      label: 'Ticket Manager', 
      icon: LayoutGrid, 
      content: <TicketManager />
    },
    { 
      id: 'ticket-inbox' as TicketCategory, 
      label: 'Ticket Inbox', 
      icon: Ticket,
      content: <TicketInbox /> 
    },
    { 
      id: 'visitor-management' as TicketCategory, 
      label: 'Visitor Management', 
      icon: Users,
      content: <PlaceholderContent title="Visitor Management" /> 
    },
    { 
      id: 'appointments' as TicketCategory, 
      label: 'Appointments', 
      icon: Calendar,
      content: <PlaceholderContent title="Appointments" /> 
    },
    { 
      id: 'mail-packages' as TicketCategory, 
      label: 'Mail & Packages', 
      icon: Mail,
      content: <PlaceholderContent title="Mail & Packages" /> 
    },
    { 
      id: 'general-inquiries' as TicketCategory, 
      label: 'General Inquiries', 
      icon: Phone,
      content: <PlaceholderContent title="General Inquiries / Calls" /> 
    },
    { 
      id: 'employee-support' as TicketCategory, 
      label: 'Employee Support', 
      icon: LifeBuoy,
      content: <PlaceholderContent title="Employee Support" /> 
    },
    { 
      id: 'event-prep' as TicketCategory, 
      label: 'Event Prep', 
      icon: CalendarDays,
      content: <PlaceholderContent title="Event Prep" /> 
    },
    { 
      id: 'feedback-complaints' as TicketCategory, 
      label: 'Feedback & Complaints', 
      icon: MessageSquare,
      content: <PlaceholderContent title="Feedback & Complaints" /> 
    },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-intranet-dark">
      <div className="w-full p-1 sm:p-2">
        <div className="flex flex-col gap-1 md:gap-0 md:flex-row md:justify-between md:items-center mb-2 py-1">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full h-8 w-8 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src="/SCPNG Original Logo.png" alt="SCPNG Logo" className="h-7" />
            <h1 className="text-2xl font-bold ml-1">Support Ticketing System</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {activeTab === 'ticket-manager' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'board' }))}
                  className="rounded-r-none h-8"
                >
                  <Kanban className="h-4 w-4 mr-1" />
                  Board
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'grid' }))}
                  className="rounded-l-none h-8"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button 
                  onClick={() => document.dispatchEvent(new CustomEvent('create-ticket'))}
                  className="bg-primary text-white hover:bg-primary/90 h-8"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Ticket
                </Button>
              </>
            )}
            <div className="flex items-center gap-2 ml-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                SC
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <Tabs 
            defaultValue="ticket-inbox" 
            className="w-full" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TicketCategory)}
          >
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 overflow-x-auto">
              <TabsList className="flex space-x-2 bg-transparent h-16">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center gap-2 h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent dark:text-gray-300 data-[state=active]:dark:text-white"
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Tickets; 