import React, { useState, useEffect } from 'react';
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
import { supabase, logger } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { getStaffMemberByEmail } from '@/data/divisions';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>("User");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    logger.info('Index Page: Fetching user data...');

    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          logger.error('Index Page: Error fetching user', error);
          setDisplayName("User");
        } else if (data.user) {
          logger.success('Index Page: User data fetched', data.user);
          setCurrentUser(data.user);
          
          const email = data.user.email;
          if (email) {
            const staffMember = getStaffMemberByEmail(email);
            setDisplayName(staffMember?.name || email);
          } else {
            setDisplayName(data.user.user_metadata?.name || "User");
          }
        } else {
           setDisplayName("User");
        }
        setLoading(false);
      })
      .catch(err => {
        if (isMounted) {
          logger.error('Index Page: Unexpected error fetching user', err);
          setDisplayName("User");
          setLoading(false);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT') {
            logger.info('Index Page: User signed out, clearing user data.');
            setCurrentUser(null);
            setDisplayName("User");
        }
        else if (event === 'SIGNED_IN' && session?.user) {
            const email = session.user.email;
             if (email) {
               const staffMember = getStaffMemberByEmail(email);
               setDisplayName(staffMember?.name || email);
             } else {
               setDisplayName(session.user.user_metadata?.name || "User");
             }
        }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      logger.info('Index Page: Unmounting');
    };
  }, []);

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
      <WelcomeBanner />
      
      <WelcomeCard 
        name={displayName}
        date={currentDate}
        greeting="Welcome to the SCPNG Intranet Portal"
        location="MRDC House"
      />
      
      <PersonalKPICards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <PersonalKPIStats />
          
          <OrganizationalOverview />
        </div>
        
        <div>
          <QuickAccess />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <KPIStatistics />
        </div>
        <NoticeBoard />
      </div>
      
      <ScheduledEvents 
        businessPercentage={75} 
        stats={eventStats} 
      />
    </PageLayout>
  );
};

export default Index;
