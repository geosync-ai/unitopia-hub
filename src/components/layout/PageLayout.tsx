
import React from 'react';
import MainSidebar from './MainSidebar';
import { Bell, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "You have 3 unread notifications",
    });
  };

  return (
    <div className="min-h-screen bg-background dark:bg-intranet-dark">
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
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-intranet-primary focus:border-transparent bg-white dark:bg-intranet-dark dark:border-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <button 
              onClick={handleNotificationClick}
              className="p-2 rounded-full bg-white text-intranet-primary hover:bg-gray-100 transition-colors shadow-sm dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              <Bell size={20} />
            </button>
            
            {user && (
              <div className="text-sm font-medium ml-2">
                {user.email}
                {user.role && (
                  <span className="ml-2 bg-intranet-primary text-white text-xs py-0.5 px-2 rounded-full">
                    {user.role}
                  </span>
                )}
              </div>
            )}
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
