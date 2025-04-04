
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Brush } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCircle from './StatCircle';
import { Activity } from 'lucide-react';

const PersonalKPIStats: React.FC = () => {
  // Mock data for personal KPI stats
  const monthlyData = [
    { name: 'Jan', productivity: 65, efficiency: 70, attendance: 95 },
    { name: 'Feb', productivity: 68, efficiency: 72, attendance: 97 },
    { name: 'Mar', productivity: 75, efficiency: 78, attendance: 96 },
    { name: 'Apr', productivity: 80, efficiency: 80, attendance: 98 },
    { name: 'May', productivity: 78, efficiency: 82, attendance: 97 },
    { name: 'Jun', productivity: 82, efficiency: 85, attendance: 99 },
    { name: 'Jul', productivity: 87, efficiency: 90, attendance: 96 },
    { name: 'Aug', productivity: 90, efficiency: 92, attendance: 95 },
  ];

  const skillsData = {
    technical: 82,
    leadership: 75,
    teamwork: 90,
    communication: 85
  };

  return (
    <Card className="shadow-sm animate-fade-in">
      <CardHeader className="pb-0 pt-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5 text-intranet-primary" />
          Personal KPI Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="performance">Performance Trends</TabsTrigger>
            <TabsTrigger value="skills">Skills Assessment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-2 pt-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Score']}
                  />
                  <Area type="monotone" dataKey="productivity" name="Productivity" stroke="#83002A" fill="#83002A" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="efficiency" name="Efficiency" stroke="#5C001E" fill="#5C001E" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="attendance" name="Attendance" stroke="#9E3A5D" fill="#9E3A5D" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Monthly Performance Metrics (%)
            </div>
          </TabsContent>
          
          <TabsContent value="skills">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
              <div className="flex justify-center">
                <StatCircle 
                  percentage={skillsData.technical} 
                  label="Technical Skills"
                  gradientColors={['#83002A', '#5C001E']}
                />
              </div>
              <div className="flex justify-center">
                <StatCircle 
                  percentage={skillsData.leadership} 
                  label="Leadership"
                  gradientColors={['#83002A', '#5C001E']}
                />
              </div>
              <div className="flex justify-center">
                <StatCircle 
                  percentage={skillsData.teamwork} 
                  label="Teamwork"
                  gradientColors={['#83002A', '#5C001E']}
                />
              </div>
              <div className="flex justify-center">
                <StatCircle 
                  percentage={skillsData.communication} 
                  label="Communication"
                  gradientColors={['#83002A', '#5C001E']}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PersonalKPIStats;
