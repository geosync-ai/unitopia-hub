
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
    <Card className="bg-white rounded-xl shadow-sm animate-fade-in">
      <CardHeader className="pb-0 pt-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">MY SCHEDULED EVENTS</h3>
          <Button variant="outline" size="sm" className="h-6 text-xs">
            Today
            <ChevronDown size={12} className="ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 flex flex-col items-center">
        <div className="mb-3 transform scale-90">
          <StatCircle 
            percentage={businessPercentage} 
            label="BUSINESS"
            gradientColors={['#FF6B6B', '#4169E1', '#6A5ACD']}
          />
        </div>
        
        <div className="space-y-2 w-full">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="text-base font-semibold">{stat.count}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledEvents;
