
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
      {/* Welcome Banner */}
      <div className="mb-4">
        <WelcomeBanner />
      </div>
      
      {/* Welcome Card */}
      <div className="mb-4">
        <WelcomeCard 
          name={user?.name || "User"} 
          date={currentDate}
          greeting="Welcome to the SCPNG Intranet Portal"
          location="MRDC House"
        />
      </div>
      
      {/* Personal KPI Cards in row */}
      <div className="mb-4">
        <PersonalKPICards />
      </div>
      
      {/* Main content area with 3 columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* First column - KPI Stats and Org Overview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal KPI Stats */}
          <PersonalKPIStats />
          
          {/* Organizational Overview */}
          <OrganizationalOverview />
          
          {/* KPI Statistics */}
          <KPIStatistics />
        </div>
        
        {/* Second column - Quick Access and Notice Board */}
        <div className="space-y-4">
          {/* Quick Access Links */}
          <QuickAccess />
          
          {/* Notice Board with news slideshow */}
          <NoticeBoard />
          
          {/* Scheduled Events */}
          <ScheduledEvents 
            businessPercentage={75} 
            stats={eventStats} 
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
