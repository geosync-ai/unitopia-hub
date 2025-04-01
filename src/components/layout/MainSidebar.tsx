
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
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const MainSidebar = () => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [isFirstRender, setIsFirstRender] = useState(true);
  
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
    { icon: MessageSquare, path: '/ai-hub', label: 'AI Hub' },
    { icon: GalleryHorizontal, path: '/gallery', label: 'Gallery' },
    { icon: Users, path: '/contacts', label: 'Contacts' },
    { icon: BarChart2, path: '/organization', label: 'Organization' },
    { icon: Calendar, path: '/calendar', label: 'Calendar' },
  ];
  
  // Show admin link only to admins
  if (isAdmin) {
    navItems.push({ icon: Database, path: '/admin', label: 'Admin' });
  }
  
  // Always show settings at the end
  navItems.push({ icon: Settings, path: '/settings', label: 'Settings' });

  return (
    <div className="fixed inset-y-0 left-0 w-20 bg-gradient-to-b from-[#400010] to-[#200008] flex flex-col items-center py-6 z-10 shadow-lg dark:from-[#300010] dark:to-black rounded-r-2xl">
      <div className="mb-10">
        <div className="text-white font-bold text-center">
          <div className="mb-1">SCPNG</div>
          <div className="text-xs">Intranet</div>
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-6 mt-4 flex-1">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={index} 
              to={item.path}
              className={cn(
                "flex flex-col items-center text-white/80 hover:text-white transition-colors group", 
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
      
      <button 
        onClick={logout}
        className="flex flex-col items-center text-white/80 hover:text-white transition-colors group mt-auto mb-6 icon-hover-effect"
      >
        <div className="p-3 rounded-lg group-hover:bg-white/10 transition-colors">
          <LogOut size={20} />
        </div>
        <span className="text-xs mt-1">Logout</span>
      </button>
    </div>
  );
};

export default MainSidebar;
