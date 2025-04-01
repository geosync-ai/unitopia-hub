
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import UserProfile from '@/components/dashboard/UserProfile';
import MetricCard from '@/components/dashboard/MetricCard';
import Calendar from '@/components/dashboard/Calendar';
import ProgressChart from '@/components/dashboard/ProgressChart';
import ScheduledEvents from '@/components/dashboard/ScheduledEvents';

const Index = () => {
  // Mock data
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  const userName = "John Anderson";
  
  const metricData = [
    { 
      title: "OFFLINE WORK", 
      value: 27, 
      subtitle: "department tasks", 
      trend: -8, 
      trendType: 'decrease' as const, 
      trendLabel: "than average", 
      color: "#FF6B6B",
      data: Array(12).fill(0).map((_, i) => ({ value: 20 + Math.random() * 20 })),
    },
    { 
      title: "ONLINE WORK", 
      value: 9, 
      subtitle: "online consultations", 
      trend: 12, 
      trendType: 'increase' as const, 
      trendLabel: "than average", 
      color: "#4CAF50",
      data: Array(12).fill(0).map((_, i) => ({ value: 10 + Math.random() * 15 })),
    },
    { 
      title: "DOCUMENT WORK", 
      value: 19, 
      subtitle: "document reviews", 
      trend: 10, 
      trendType: 'increase' as const, 
      trendLabel: "than average", 
      color: "#4169E1",
      data: Array(12).fill(0).map((_, i) => ({ value: 15 + Math.random() * 15 })),
    },
  ];

  const calendarEvents = [
    { time: "2:00 pm", title: "Meeting with department lead" },
    { time: "2:30 pm", title: "Project review" },
    { time: "3:00 pm", title: "Call with client" },
    { time: "3:30 pm", title: "Document preparation" },
  ];

  const progressItems = [
    { label: "Documentation", value: 64, color: "#4169E1" },
    { label: "Reviews", value: 50, color: "#FF6B6B" },
    { label: "Meetings", value: 33, color: "#FF69B4" },
  ];

  const scheduledStats = [
    { count: 25, label: "Consultations" },
    { count: 10, label: "Document reviews" },
    { count: 3, label: "Meetings" },
  ];

  return (
    <PageLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WelcomeCard 
            name={userName.split(' ')[0]} 
            date={currentDate} 
            greeting="Welcome to your SCPNG Intranet Dashboard" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {metricData.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
                trend={metric.trend}
                data={metric.data}
                trendType={metric.trendType}
                trendLabel={metric.trendLabel}
                color={metric.color}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <ScheduledEvents 
              businessPercentage={95} 
              stats={scheduledStats} 
            />
            <ProgressChart 
              title="MY PLANS DONE" 
              items={progressItems} 
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <UserProfile 
            name={userName}
            title="Team Lead"
            location="Brisbane, Australia"
            dateOfBirth="14.05.83"
            bloodType="O(+)"
            workingHours="9am - 5pm"
          />
          
          <Calendar events={calendarEvents} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
