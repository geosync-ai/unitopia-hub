
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCircle from './StatCircle';

interface EventStat {
  count: number;
  label: string;
}

interface ScheduledEventsProps {
  businessPercentage: number;
  stats: EventStat[];
}

const ScheduledEvents: React.FC<ScheduledEventsProps> = ({
  businessPercentage,
  stats
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">MY SCHEDULED EVENTS</h3>
        <Button variant="outline" size="sm" className="h-8">
          Today
          <ChevronDown size={16} className="ml-1" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="mb-4">
          <StatCircle 
            percentage={businessPercentage} 
            label="BUSINESS"
            gradientColors={['#FF6B6B', '#4169E1', '#6A5ACD']}
          />
        </div>
        
        <div className="space-y-3 w-full">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="text-lg font-semibold">{stat.count}</div>
              <div className="text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduledEvents;
