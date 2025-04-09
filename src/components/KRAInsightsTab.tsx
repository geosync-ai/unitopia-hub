import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KRA } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface KRAInsightsTabProps {
  kras: KRA[];
}

export const KRAInsightsTab: React.FC<KRAInsightsTabProps> = ({ kras }) => {
  // Ensure kras is an array and handle null/undefined
  const validKras = Array.isArray(kras) ? kras : [];
  
  // Group kras by department and calculate average progress
  const departmentData = React.useMemo(() => {
    const departments = Array.from(new Set(validKras.map(kra => kra.department)));
    return departments.map(dept => {
      const deptKras = validKras.filter(kra => kra.department === dept);
      const avgProgress = deptKras.length > 0 
        ? deptKras.reduce((sum, kra) => sum + (kra.progress || 0), 0) / deptKras.length
        : 0;
      return {
        name: dept || 'Unknown',
        value: Math.round(avgProgress)
      };
    });
  }, [validKras]);

  // Safe function to filter KPIs by status
  const safeKpiFilter = (status: string) => {
    return validKras.flatMap(kra => (kra.kpis || []))
      .filter(kpi => kpi && kpi.status === status).length;
  };

  // KPI status data
  const kpiStatusData = [
    { name: 'On Track', value: safeKpiFilter('on-track') },
    { name: 'At Risk', value: safeKpiFilter('at-risk') },
    { name: 'Behind', value: safeKpiFilter('behind') },
    { name: 'Completed', value: safeKpiFilter('completed') }
  ];

  // KRA performance data
  const kraPerformanceData = [
    { name: 'On Track', value: validKras.filter(kra => kra.status === 'in-progress' && kra.progress >= 80).length },
    { name: 'At Risk', value: validKras.filter(kra => kra.status === 'in-progress' && kra.progress >= 50 && kra.progress < 80).length },
    { name: 'Behind', value: validKras.filter(kra => kra.status === 'in-progress' && kra.progress < 50).length },
    { name: 'Completed', value: validKras.filter(kra => kra.status === 'closed').length },
    { name: 'Not Started', value: validKras.filter(kra => kra.status === 'open').length }
  ];

  // Progress trend data
  const progressTrendData = [
    { month: 'Jan', progress: 10 },
    { month: 'Feb', progress: 25 },
    { month: 'Mar', progress: 35 },
    { month: 'Apr', progress: 48 },
    { month: 'May', progress: 52 },
    { month: 'Jun', progress: 63 },
    { month: 'Jul', progress: 68 },
    { month: 'Aug', progress: 72 },
    { month: 'Sep', progress: 80 },
    { month: 'Oct', progress: 85 },
    { month: 'Nov', progress: 90 },
    { month: 'Dec', progress: 95 }
  ];

  // Custom colors for charts
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#94a3b8'];

  return (
    <div className="space-y-8 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Overall KRA performance distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kraPerformanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {kraPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* KPI Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>KPI Status</CardTitle>
            <CardDescription>Status breakdown of all KPIs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical"
                  data={kpiStatusData}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip formatter={(value) => [`${value} KPIs`, 'Count']} />
                  <Legend />
                  <Bar dataKey="value" name="KPIs">
                    {kpiStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Department Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Average KRA progress by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical"
                  data={departmentData}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                  <Legend />
                  <Bar dataKey="value" name="Progress" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Trend Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>KRA Progress Trend</CardTitle>
            <CardDescription>Progress trajectory over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={progressTrendData}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                  <Area type="monotone" dataKey="progress" stroke="#3b82f6" fill="#3b82f680" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KRAInsightsTab; 