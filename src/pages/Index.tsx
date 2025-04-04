
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import QuickAccess from '@/components/dashboard/QuickAccess';
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import ScheduledEvents from '@/components/dashboard/ScheduledEvents';
import OrganizationalOverview from '@/components/dashboard/OrganizationalOverview';
import KPIStatistics from '@/components/dashboard/KPIStatistics';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import PersonalKPICards from '@/components/dashboard/PersonalKPICards';
import PersonalKPIStats from '@/components/dashboard/PersonalKPIStats';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();
  
  // Get current date in proper format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Sample event stats for ScheduledEvents component
  const eventStats = [
    { count: 3, label: "Meetings" },
    { count: 2, label: "Tasks Due" },
    { count: 1, label: "Training Sessions" }
  ];
  
  return (
    <PageLayout>
      <WelcomeBanner />
      
      <WelcomeCard 
        name={user?.name || "User"} 
        date={currentDate}
        greeting="Welcome to the SCPNG Intranet Portal"
        location="MRDC House"
      />
      
      {/* Personal KPI Cards */}
      <PersonalKPICards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal KPI Stats */}
          <PersonalKPIStats />
          
          {/* Organizational Overview moved to left side */}
          <OrganizationalOverview />
        </div>
        
        {/* Quick Access moved to right side */}
        <div>
          <QuickAccess />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {/* KPI Statistics */}
          <KPIStatistics />
        </div>
        <NoticeBoard />
      </div>
      
      {/* Scheduled Events */}
      <ScheduledEvents 
        businessPercentage={75} 
        stats={eventStats} 
      />
    </PageLayout>
  );
};

export default Index;
