
import React from 'react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  trend: number;
  data: Array<{ value: number }>;
  trendType: 'increase' | 'decrease';
  trendLabel: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  data,
  trendType,
  trendLabel,
  color
}) => {
  const trendColor = trendType === 'increase' 
    ? 'text-intranet-success bg-green-50' 
    : 'text-intranet-danger bg-red-50';
    
  const trendSign = trendType === 'increase' ? '+' : '-';

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm h-full animate-fade-in">
      <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">{title}</h3>
      
      <div className="flex justify-between items-start mb-1">
        <div>
          <span className="text-2xl font-bold block">{value}</span>
          <span className="text-xs text-gray-500">{subtitle}</span>
        </div>
        
        <div className="w-20 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-1">
        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] ${trendColor}`}>
          {trendSign}{Math.abs(trend)}% {trendLabel}
        </span>
      </div>
    </div>
  );
};

export default MetricCard;
