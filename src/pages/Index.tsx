import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import UserProfile from '@/components/dashboard/UserProfile';
import MetricCard from '@/components/dashboard/MetricCard';
import Calendar from '@/components/dashboard/Calendar';
import ProgressChart from '@/components/dashboard/ProgressChart';
import ScheduledEvents from '@/components/dashboard/ScheduledEvents';
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import OrganizationalOverview from '@/components/dashboard/OrganizationalOverview';
import QuickAccess from '@/components/dashboard/QuickAccess';
import { Target } from 'lucide-react';

const Index = () => {
  // Current date in Papua New Guinea format
  const currentDate = new Date().toLocaleDateString('en-PG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'Pacific/Port_Moresby'
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

  // New KPI statistics for PNG context
  const kpiStats = [
    { label: "License Applications", value: 85, target: 100, color: "#83002A" },
    { label: "Regulatory Compliance", value: 92, target: 95, color: "#4CAF50" },
    { label: "Staff Training", value: 68, target: 80, color: "#FF9800" },
    { label: "Stakeholder Engagement", value: 76, target: 90, color: "#4169E1" }
  ];

  return (
    <PageLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main content - 8 columns */}
        <div className="lg:col-span-8">
          <WelcomeCard 
            name={userName.split(' ')[0]} 
            date={currentDate} 
            greeting="Welcome to your SCPNG Intranet Dashboard" 
            location="MRDC House, Port Moresby" // PNG location
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
          
          {/* KPI Statistics Section */}
          <div className="mt-6 bg-white rounded-xl shadow-sm p-5 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 text-intranet-primary mr-2" />
              KPI Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kpiStats.map((kpi, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{kpi.label}</span>
                    <span className="text-sm font-medium">{kpi.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${kpi.value}%`,
                        backgroundColor: kpi.color
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs text-gray-500">Target: {kpi.target}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <OrganizationalOverview />
          </div>
        </div>
        
        {/* Right sidebar - 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          <UserProfile 
            name={userName}
            title="Team Lead"
            location="MRDC House, Port Moresby"
            dateOfBirth="14.05.83"
            bloodType="O(+)"
            workingHours="9am - 5pm"
          />
          
          <Calendar events={calendarEvents} />
          
          <QuickAccess />
          
          <NoticeBoard />
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
