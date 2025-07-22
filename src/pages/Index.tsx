import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import PageLayout from '@/components/layout/PageLayout';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import QuickAccess from '@/components/dashboard/QuickAccess';
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import ScheduledEvents from '@/components/dashboard/ScheduledEvents';
import OrganizationalOverview from '@/components/dashboard/OrganizationalOverview';
import KPIStatistics from '@/components/dashboard/KPIStatistics';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import PersonalKPICards from '@/components/dashboard/PersonalKPICards';
import PersonalKPIStats from '@/components/dashboard/PersonalKPIStats';
import { supabase, logger } from '@/lib/supabaseClient';
import { getStaffMemberByEmail } from '@/data/divisions';

const Index = () => {
  const [displayName, setDisplayName] = useState<string>("User");
  const [loading, setLoading] = useState(true);
  const { accounts } = useMsal();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    logger.info('Index Page: Checking MSAL authentication state...');

    if (accounts.length > 0) {
      const account = accounts[0];
      const name = account.name || account.username || "User";
      const email = account.username;

      logger.success('Index Page: MSAL user identified', { name, email });
      
      if (email) {
          const staffMember = getStaffMemberByEmail(email);
          setDisplayName(staffMember?.name || name);
      } else {
          setDisplayName(name);
      }
      
    } else {
       logger.info('Index Page: No MSAL account found.');
       setDisplayName("User");
    }

    setLoading(false);

    return () => {
      isMounted = false;
      logger.info('Index Page: Unmounting');
    };
  }, [accounts]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const eventStats = [
    { count: 3, label: "Meetings" },
    { count: 2, label: "Tasks Due" },
    { count: 1, label: "Training Sessions" }
  ];
  
  if (loading) {
    // You can return a loading indicator here if desired
    // For now, we'll let the components render potentially without user name briefly
    // Or return null/a spinner layout
    // return <PageLayout><div>Loading user data...</div></PageLayout>; 
  }
  
  return (
    <PageLayout>
      <WelcomeBanner 
        name={displayName}
        date={currentDate}
        greeting="Welcome to the SCPNG Intranet Portal"
        location="MRDC House"
      />
      
      {/* <WelcomeCard 
        name={displayName}
        date={currentDate}
        greeting="Welcome to the SCPNG Intranet Portal"
        location="MRDC House"
      /> */}
      
      <PersonalKPICards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 space-y-4">
          <PersonalKPIStats />
          <KPIStatistics />
          <OrganizationalOverview />
        </div>
        
        <div className="flex flex-col space-y-4">
          <QuickAccess />
          <RecentActivity />
          <NoticeBoard />
        </div>
      </div>
      
      <ScheduledEvents 
        businessPercentage={75} 
        stats={eventStats} 
      />
    </PageLayout>
  );
};

export default Index;
