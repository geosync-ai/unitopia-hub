
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Bell, 
  Users, 
  BarChart2, 
  Calendar, 
  Settings, 
  Database, 
  MessageSquare
} from 'lucide-react';

const MainSidebar = () => {
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Bell, path: '/news', label: 'News' },
    { icon: FileText, path: '/documents', label: 'Documents' },
    { icon: MessageSquare, path: '/ai-hub', label: 'AI Hub' },
    { icon: Users, path: '/contacts', label: 'Contacts' },
    { icon: BarChart2, path: '/organization', label: 'Organization' },
    { icon: Calendar, path: '/calendar', label: 'Calendar' },
    { icon: Database, path: '/admin', label: 'Admin' },
    { icon: Settings, path: '/settings', label: 'Settings' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-20 bg-intranet-primary flex flex-col items-center py-6 z-10">
      <div className="mb-10">
        <div className="text-white font-bold text-center">
          <div className="mb-1">SCPNG</div>
          <div className="text-xs">Intranet</div>
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-8 mt-4">
        {navItems.map((item, index) => (
          <Link 
            key={index} 
            to={item.path}
            className="flex flex-col items-center text-white hover:text-intranet-light transition-colors group"
          >
            <div className="p-2 rounded-lg group-hover:bg-white/10 transition-colors">
              <item.icon size={20} />
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MainSidebar;
