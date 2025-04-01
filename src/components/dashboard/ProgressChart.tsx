
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressItem {
  label: string;
  value: number;
  color: string;
}

interface ProgressChartProps {
  title: string;
  items: ProgressItem[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ title, items }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">{item.label}</span>
              <span className="text-sm font-medium">{item.value}%</span>
            </div>
            <Progress 
              value={item.value} 
              className="h-2"
              style={{ backgroundColor: '#f1f1f1' }}
              indicatorClassName={`bg-[${item.color}]`}
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-6">
        <button className="text-intranet-primary text-sm border border-intranet-primary rounded-lg py-2 px-4 hover:bg-intranet-primary hover:text-white transition-colors flex items-center gap-1">
          <span>Add plan</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProgressChart;
