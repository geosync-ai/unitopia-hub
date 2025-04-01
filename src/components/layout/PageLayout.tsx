
import React from 'react';
import MainSidebar from './MainSidebar';
import { Bell, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const { toast } = useToast();
  
  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "You have 3 unread notifications",
    });
  };

  return (
    <div className="min-h-screen bg-intranet-light">
      <MainSidebar />
      
      <div className="ml-20 p-4 sm:p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for events, documents, contacts etc."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-intranet-primary focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleNotificationClick}
              className="p-2 rounded-full bg-white text-intranet-primary hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Bell size={20} />
            </button>
          </div>
        </header>
        
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
