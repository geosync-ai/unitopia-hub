
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Users, Calendar, ExternalLink, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Notice {
  id: number;
  title: string;
  content: string;
  date: string;
  category: 'announcement' | 'event' | 'update' | 'alert';
  isPinned?: boolean;
}

const NoticeBoard = () => {
  // Mock notices data
  const notices: Notice[] = [
    {
      id: 1,
      title: 'System Maintenance Scheduled',
      content: 'The intranet system will be undergoing maintenance on Saturday from 10 PM to 2 AM. Please save your work accordingly.',
      date: '2023-12-01',
      category: 'announcement',
      isPinned: true
    },
    {
      id: 2,
      title: 'Annual General Meeting',
      content: 'All staff are invited to attend the Annual General Meeting on December 15th at the main conference hall.',
      date: '2023-12-15',
      category: 'event',
      isPinned: true
    },
    {
      id: 3,
      title: 'New Document Management System',
      content: 'We have updated our document management system. Training sessions will be held next week.',
      date: '2023-11-28',
      category: 'update'
    },
    {
      id: 4,
      title: 'Holiday Schedule',
      content: 'The office will be closed from December 24th to January 2nd for the holiday season.',
      date: '2023-12-24',
      category: 'announcement'
    },
    {
      id: 5,
      title: 'Quarterly Performance Review',
      content: 'Department heads are requested to submit Q4 performance reviews by December 10th.',
      date: '2023-12-10',
      category: 'alert'
    }
  ];

  // Get category badge color and icon
  const getCategoryDetails = (category: Notice['category']) => {
    switch (category) {
      case 'announcement':
        return { color: 'bg-blue-500', icon: <Bell size={14} /> };
      case 'event':
        return { color: 'bg-green-500', icon: <Calendar size={14} /> };
      case 'update':
        return { color: 'bg-yellow-500', icon: <ExternalLink size={14} /> };
      case 'alert':
        return { color: 'bg-red-500', icon: <Bell size={14} /> };
      default:
        return { color: 'bg-gray-500', icon: <Bell size={14} /> };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="bg-gradient-to-br from-card to-muted/80 shadow-md animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bell className="h-5 w-5 text-intranet-primary" />
          SCPNG Notice Board
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`p-3 rounded-lg border border-border hover:border-intranet-primary/50 transition-colors duration-300 
                ${notice.isPinned ? 'border-intranet-primary/50 bg-intranet-primary/5' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  {notice.isPinned && <Pin size={14} className="text-intranet-primary animate-pulse" />}
                  {notice.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 text-white ${getCategoryDetails(notice.category).color}`}
                  >
                    {getCategoryDetails(notice.category).icon}
                    <span>{notice.category}</span>
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{notice.content}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(notice.date)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoticeBoard;
