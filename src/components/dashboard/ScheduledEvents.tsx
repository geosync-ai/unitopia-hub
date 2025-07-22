
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">MY SCHEDULED EVENTS</CardTitle>
          <Button variant="outline" size="sm" className="h-8">
            Today
            <ChevronDown size={16} className="ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default ScheduledEvents;
