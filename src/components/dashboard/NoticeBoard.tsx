
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Calendar, ExternalLink, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Notice {
  id: number;
  title: string;
  content: string;
  date: string;
  category: 'announcement' | 'event' | 'update' | 'alert';
  isPinned?: boolean;
}

const NewsCarousel: React.FC = () => {
  const newsImages = [
    "https://picsum.photos/id/1033/800/400",
    "https://picsum.photos/id/1025/800/400",
    "https://picsum.photos/id/1015/800/400",
    "https://picsum.photos/id/1018/800/400"
  ];
  
  return (
    <Carousel className="w-full mb-4">
      <CarouselContent>
        {newsImages.map((image, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <div className="overflow-hidden rounded-md">
                <img
                  src={image}
                  alt={`News image ${index + 1}`}
                  className="h-48 w-full object-cover transition-all hover:scale-105"
                />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex justify-center mt-2">
        <CarouselPrevious className="relative static left-0 translate-y-0 mr-2" />
        <CarouselNext className="relative static right-0 translate-y-0" />
      </div>
    </Carousel>
  );
};

const NoticeBoard = () => {
  // Mock notices data
  const notices: Notice[] = [
    {
      id: 1,
      title: 'System Maintenance',
      content: 'The intranet system will be undergoing maintenance on Saturday.',
      date: '2023-12-01',
      category: 'announcement',
      isPinned: true
    },
    {
      id: 2,
      title: 'Annual General Meeting',
      content: 'All staff are invited to attend the Annual General Meeting.',
      date: '2023-12-15',
      category: 'event',
      isPinned: true
    },
    {
      id: 3,
      title: 'New Document System',
      content: 'We have updated our document management system.',
      date: '2023-11-28',
      category: 'update'
    },
    {
      id: 4,
      title: 'Holiday Schedule',
      content: 'The office will be closed for the holiday season.',
      date: '2023-12-24',
      category: 'announcement'
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm animate-fade-in flex-grow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="h-5 w-5 text-intranet-primary" />
          SCPNG Notice Board
        </CardTitle>
      </CardHeader>
      <CardContent>
        <NewsCarousel />
        <div className="space-y-3">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`p-2.5 rounded-lg border border-border hover:border-intranet-primary/50 transition-colors duration-300 
                ${notice.isPinned ? 'border-intranet-primary/50 bg-intranet-primary/5' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-sm flex items-center gap-1">
                  {notice.isPinned && <Pin size={12} className="text-intranet-primary animate-pulse" />}
                  {notice.title}
                </h3>
                <Badge 
                  variant="outline" 
                  className={`flex items-center gap-1 text-white text-xs px-1.5 py-0.5 ${getCategoryDetails(notice.category).color}`}
                >
                  {getCategoryDetails(notice.category).icon}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 line-clamp-2">{notice.content}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(notice.date)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoticeBoard;
