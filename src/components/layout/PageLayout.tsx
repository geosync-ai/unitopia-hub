import React, { useState, useEffect } from 'react';
import MainSidebar from './MainSidebar';
import { Bell, Search, Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from './ThemeToggle';
import { supabase, logger } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    let isMounted = true;
    setUserLoading(true);
    logger.info('PageLayout: Fetching user data...');

    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          logger.error('PageLayout: Error fetching user', error);
        } else {
          logger.success('PageLayout: User data fetched', data.user);
          setCurrentUser(data.user);
        }
        setUserLoading(false);
      })
      .catch(err => {
        if (isMounted) {
          logger.error('PageLayout: Unexpected error fetching user', err);
          setUserLoading(false);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;
      logger.info(`PageLayout: Auth state changed: ${event}`);
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "You have 3 unread notifications",
    });
  };

  const handleSignOut = async () => {
    logger.info('PageLayout: Initiating sign out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('PageLayout: Error signing out', error);
        toast({ title: "Sign Out Error", description: error.message, variant: "destructive" });
      } else {
        logger.success('PageLayout: User signed out successfully');
        setCurrentUser(null);
        navigate('/login', { replace: true });
        toast({ title: "Signed Out", description: "You have been signed out successfully." });
      }
    } catch (err) {
      logger.error('PageLayout: Unexpected error during sign out', err);
      toast({ title: "Sign Out Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const getInitials = (name?: string | null, email?: string | null): string => {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-background dark:bg-intranet-dark">
      {!isMobile && <MainSidebar />}
      
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
            <ThemeToggle />
            
            <button 
              onClick={handleNotificationClick}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:shadow-md transition-all duration-300 icon-hover-effect"
            >
              <Bell size={20} />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-transparent text-white">
                      {userLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        getInitials(currentUser?.user_metadata?.name, currentUser?.email)
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userLoading ? "Loading..." : currentUser?.user_metadata?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userLoading ? "..." : currentUser?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="pb-8">
          {children}
        </main>
      </div>
      
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#83002A] to-[#5C001E] p-4 animate-slide-in rounded-r-3xl shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="text-white font-bold text-xl">SCPNG Intranet</div>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="text-white hover:bg-white/10">
                <X size={24} />
              </Button>
            </div>
            <MainSidebar closeMobileSidebar={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PageLayout;
