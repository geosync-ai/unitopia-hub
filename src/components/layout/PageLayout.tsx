import React, { useState, useEffect } from 'react';
import MainSidebar from './MainSidebar';
import { Bell, Search, Menu, X, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import DivisionSelector from '@/components/DivisionSelector';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
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
        <header className="flex items-center justify-between mb-6 bg-gradient-to-r from-intranet-primary to-intranet-secondary p-3 rounded-3xl shadow-md">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden mr-2 icon-hover-effect text-white hover:bg-white/10"
            >
              <Menu size={24} />
            </Button>
          )}
          
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/70" />
            </div>
            <input
              type="text"
              placeholder="Search for events, documents, contacts etc."
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent bg-white/10 text-white placeholder-white/70 transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <DivisionSelector />
            <ThemeToggle />
            
            <button 
              onClick={handleNotificationClick}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:shadow-md transition-all duration-300 icon-hover-effect"
            >
              <Bell size={20} />
            </button>
            
            {user && (
              <div className="flex items-center">
                <div className="text-sm font-medium mr-3 hidden sm:block text-white">
                  <div>{user.name || user.email}</div>
                  <div className="flex items-center gap-2">
                    {user.role && (
                      <span className="bg-white/20 text-white text-xs py-0.5 px-2 rounded-full">
                        {user.role}
                      </span>
                    )}
                    {user.divisionName && (
                      <span className="bg-white/20 text-white text-xs py-0.5 px-2 rounded-full">
                        {user.divisionName}
                      </span>
                    )}
                  </div>
                </div>
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="h-9 w-9 rounded-full border-2 border-white/30 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "";
                      target.onerror = null;
                      target.classList.add("bg-white/10");
                      target.classList.add("flex");
                      target.classList.add("items-center");
                      target.classList.add("justify-center");
                    }}
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <User size={18} />
                  </div>
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
          <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#83002A] to-[#5C001E] p-4 animate-slide-in rounded-r-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="text-white font-bold text-xl">SCPNG Intranet</div>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="text-white hover:bg-white/10">
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
