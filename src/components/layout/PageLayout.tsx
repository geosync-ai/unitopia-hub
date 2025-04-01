
import React, { useState, useEffect } from 'react';
import MainSidebar from './MainSidebar';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "You have 3 unread notifications",
    });
  };

  return (
    <div className="min-h-screen bg-background dark:bg-intranet-dark">
      <MainSidebar />
      
      <div className="ml-0 md:ml-20 p-4 sm:p-6 lg:p-8 animate-fade-in">
        <header className="flex items-center justify-between mb-6">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden mr-2 icon-hover-effect"
            >
              <Menu size={24} />
            </Button>
          )}
          
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for events, documents, contacts etc."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-intranet-primary focus:border-transparent bg-white dark:bg-intranet-dark dark:border-gray-700 dark:text-white transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <button 
              onClick={handleNotificationClick}
              className="p-2 rounded-full bg-gradient-to-br from-intranet-primary to-intranet-secondary text-white hover:shadow-md transition-all duration-300 icon-hover-effect"
            >
              <Bell size={20} />
            </button>
            
            {user && (
              <div className="text-sm font-medium ml-2 hidden sm:block">
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
        
        <main className="pb-8">
          {children}
        </main>
      </div>
      
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-intranet-primary p-4 animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="text-white font-bold text-xl">SCPNG Intranet</div>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="text-white">
                <X size={24} />
              </Button>
            </div>
            
            {/* Mobile sidebar content goes here */}
            {/* We'll just use the existing sidebar via CSS for now */}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageLayout;
