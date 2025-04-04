
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import QuickAccess from '@/components/dashboard/QuickAccess';
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import ScheduledEvents from '@/components/dashboard/ScheduledEvents';
import OrganizationalOverview from '@/components/dashboard/OrganizationalOverview';
import KPIStatistics from '@/components/dashboard/KPIStatistics';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();
  
  return (
    <PageLayout>
      <WelcomeCard />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <QuickAccess />
        </div>
        <NoticeBoard />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <ScheduledEvents />
          <KPIStatistics />
        </div>
        <OrganizationalOverview />
      </div>
    </PageLayout>
  );
};

export default Index;
