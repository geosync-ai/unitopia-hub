
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bookmark, FileText, Calendar, Users, Book, FileImage, Building, Target, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuickLinkProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  url: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({ icon, title, description, badge, url }) => (
  <a 
    href={url} 
    className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors"
  >
    <div className="text-intranet-primary mt-0.5">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-xs">{title}</h3>
        {badge && (
          <Badge variant="outline" className="bg-intranet-primary/10 text-intranet-primary text-[10px] h-4">
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  </a>
);

const QuickAccess: React.FC = () => {
  const quickLinks = [
    {
      icon: <FileText size={16} />,
      title: "Monthly Report",
      description: "Q2 performance report",
      badge: "Doc",
      url: "/documents"
    },
    {
      icon: <Calendar size={16} />,
      title: "Annual Meeting",
      description: "Scheduled for next month",
      badge: "Event",
      url: "/calendar"
    },
    {
      icon: <Users size={16} />,
      title: "Department Contacts",
      description: "View key personnel",
      url: "/contacts"
    },
    {
      icon: <Book size={16} />,
      title: "Policy Guidelines",
      description: "Updated regulations",
      badge: "New",
      url: "/documents"
    },
    {
      icon: <FileImage size={16} />,
      title: "Media Gallery",
      description: "Recent company events",
      url: "/gallery"
    },
    {
      icon: <Building size={16} />,
      title: "MRDC House",
      description: "Headquarters information",
      url: "/contacts"
    },
    {
      icon: <Target size={16} />,
      title: "Strategic Objectives",
      description: "Company goals and KPIs",
      badge: "Important",
      url: "/organization"
    },
    {
      icon: <Briefcase size={16} />,
      title: "Business Units",
      description: "Department structure",
      url: "/organization"
    }
  ];

  return (
    <Card className="bg-white rounded-xl shadow-sm animate-fade-in">
      <CardHeader className="pb-0 pt-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Bookmark className="h-4 w-4 text-intranet-primary" />
          Quick Access
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-0.5">
          {quickLinks.map((link, index) => (
            <QuickLink key={index} {...link} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAccess;
