
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

// Mock KPI data - in a real implementation, this would come from an API
const mockKpiData = {
  performance: [
    { name: 'Q1', target: 80, actual: 65 },
    { name: 'Q2', target: 80, actual: 78 },
    { name: 'Q3', target: 80, actual: 82 },
    { name: 'Q4', target: 80, actual: 90 }
  ],
  completion: [
    { name: 'Complete', value: 68 },
    { name: 'In Progress', value: 23 },
    { name: 'Not Started', value: 9 }
  ],
  areas: [
    { name: 'Technical Skills', score: 85 },
    { name: 'Leadership', score: 72 },
    { name: 'Innovation', score: 90 },
    { name: 'Communication', score: 65 },
    { name: 'Teamwork', score: 78 }
  ]
};

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const KPIStatistics = () => {
  const { user } = useAuth();

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>My KPI Statistics</span>
          <span className="text-sm font-normal text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString("en-PG")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="completion">Completion Rate</TabsTrigger>
            <TabsTrigger value="areas">Key Areas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockKpiData.performance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" fill="#8884d8" name="Target" />
                  <Bar dataKey="actual" fill="#82ca9d" name="Actual">
                    {mockKpiData.performance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.actual >= entry.target ? '#00C49F' : '#FF8042'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 text-sm text-muted-foreground">
              {user?.name}'s quarterly performance compared to targets
            </div>
          </TabsContent>
          
          <TabsContent value="completion">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockKpiData.completion}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockKpiData.completion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Current status of assigned KPIs
            </div>
          </TabsContent>
          
          <TabsContent value="areas">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockKpiData.areas}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8884d8">
                    {mockKpiData.areas.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Performance breakdown by key responsibility area
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default KPIStatistics;
