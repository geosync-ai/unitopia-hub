import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Bell, 
  Users, 
  BarChart2, 
  Calendar, 
  Settings, 
  Database, 
  MessageSquare, 
  GalleryHorizontal,
  LogOut,
  Target,
  Package,
  BarChart,
  Ticket,
  ListChecks,
  FormInput
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Add prop type for the logout function
interface MainSidebarProps {
  closeMobileSidebar?: () => void; // Optional prop passed from PageLayout for mobile
  handleSignOut?: () => void; // Optional prop for sign out, passed from PageLayout
}

// Update component signature to accept props
const MainSidebar: React.FC<MainSidebarProps> = ({ closeMobileSidebar, handleSignOut }) => {
  const location = useLocation();
  const [isFirstRender, setIsFirstRender] = useState(true);
  
  // TODO: Re-implement admin check logic
  // This needs to fetch user profile/role data from Supabase 
  // or receive role info via props from PageLayout after it fetches the user.
  const isAdmin = false; // TEMPORARY: Assume not admin

  useEffect(() => {
    // After component mounts, set isFirstRender to false
    // This will prevent animations from restarting on route changes
    if (isFirstRender) {
      const timer = setTimeout(() => {
        setIsFirstRender(false);
      }, 1000); // Allow enough time for initial animations
      
      return () => clearTimeout(timer);
    }
  }, [isFirstRender]);
  
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Bell, path: '/news', label: 'News' },
    { icon: FileText, path: '/documents', label: 'Documents' },
    { icon: FormInput, path: '/forms', label: 'Forms' },
    { icon: MessageSquare, path: '/ai-hub', label: 'AI Hub' },
    { icon: Ticket, path: '/tickets', label: 'Tickets' },
    { icon: FileText, path: '/licensing-registry', label: 'Licensing' },
    // --- Temporarily comment out routes needing role/division checks --- 
    // TODO: Re-enable these based on fetched user role/division
    { icon: GalleryHorizontal, path: '/gallery', label: 'Gallery' },
    { icon: Users, path: '/contacts', label: 'Contacts' },
    { icon: Target, path: '/unit', label: 'Unit' },
    { icon: BarChart, path: '/reports', label: 'Reports' },
    // { icon: Calendar, path: '/calendar', label: 'Calendar' },
    { icon: Package, path: '/asset-management', label: 'Assets' },
    { icon: Users, path: '/organization', label: 'Organization' },
  ];
  
  // Show admin link only to admins (using temporary isAdmin flag)
  if (isAdmin) {
    navItems.push({ icon: Database, path: '/admin', label: 'Admin' });
  }
  
  // Always show settings at the end
  navItems.push({ icon: Settings, path: '/settings', label: 'Settings' });

  return (
    <div className="fixed inset-y-0 left-0 w-20 bg-gradient-to-b from-[#400010] to-[#200008] flex flex-col items-center py-6 z-10 shadow-lg dark:from-[#300010] dark:to-black rounded-r-2xl">
      {/* Logo - Fixed at top */}
      <div className="mb-8 flex justify-center px-2 flex-shrink-0">
        <img 
          src="/images/SCPNG Original Logo.png" 
          alt="SCPNG Logo" 
          className="w-16 h-auto"
        />
      </div>
      
      {/* Scrollable Navigation Menu */}
      <div className="flex flex-col items-center mt-4 flex-1 w-full overflow-y-auto sidebar-scrollable pr-1">
        <div className="flex flex-col items-center space-y-6 w-full">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={index} 
                to={item.path}
                // Add onClick handler to close mobile sidebar if prop exists
                onClick={closeMobileSidebar}
                className={cn(
                  "flex flex-col items-center text-white/80 hover:text-white transition-colors group w-full", 
                  isActive && "text-white",
                  isFirstRender && "animate-slide-in"
                )}
                style={isFirstRender ? { animationDelay: `${index * 0.05}s` } : undefined}
              >
                <div className={cn(
                  "p-3 rounded-lg group-hover:bg-white/10 transition-all duration-200 icon-hover-effect",
                  isActive && "bg-white/10"
                )}>
                  <item.icon size={20} />
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Use the handleSignOut prop passed from PageLayout - Fixed at bottom */}
      {handleSignOut && (
        <button 
          onClick={handleSignOut} // Use the passed function
          className="flex flex-col items-center text-white/80 hover:text-white transition-colors group mb-6 icon-hover-effect flex-shrink-0"
          title="Sign Out" // Add title for accessibility
        >
          <div className="p-3 rounded-lg group-hover:bg-white/10 transition-colors">
            <LogOut size={20} />
          </div>
          <span className="text-xs mt-1">Logout</span>
        </button>
      )}
    </div>
  );
};

export default MainSidebar;
