import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Kra, Kpi } from '@/types/kpi';
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
  kras: Kra[];
}

const getKraProgress = (kpis: Kpi[]): number => {
  if (!kpis || kpis.length === 0) return 0;
  const totalTarget = kpis.reduce((sum, kpi) => sum + (Number(kpi.target) || 0), 0);
  if (totalTarget === 0) return 0;
  const totalActual = kpis.reduce((sum, kpi) => sum + (Number(kpi.actual) || 0), 0);
  const progress = Math.min(100, (totalActual / totalTarget) * 100);
  return Math.round(progress);
};

const getKraStatus = (kpis: Kpi[]): Kpi['status'] => {
  if (!kpis || kpis.length === 0) return 'Not Started';
  if (kpis.some(kpi => kpi.status === 'At Risk')) return 'At Risk';
  if (kpis.every(kpi => kpi.status === 'Completed')) return 'Completed';
  if (kpis.some(kpi => kpi.status === 'On Hold')) return 'On Hold';
  if (kpis.some(kpi => kpi.status === 'In Progress')) return 'In Progress';
  if (kpis.some(kpi => kpi.status === 'On Track')) return 'On Track';
  return 'Not Started';
};

export const KRAInsightsTab: React.FC<KRAInsightsTabProps> = ({ kras }) => {
  const validKras = Array.isArray(kras) ? kras : [];
  
  const departmentData = React.useMemo(() => {
    const departments = Array.from(new Set(validKras.map(kra => kra.unit || 'Unknown')));
    return departments.map(dept => {
      const deptKras = validKras.filter(kra => (kra.unit || 'Unknown') === dept);
      const avgProgress = deptKras.length > 0
        ? deptKras.reduce((sum, kra) => sum + getKraProgress(kra.kpis || []), 0) / deptKras.length
        : 0;
      return {
        name: dept,
        value: Math.round(avgProgress)
      };
    });
  }, [validKras]);

  const safeKpiFilter = (status: Kpi['status']) => {
    return validKras.flatMap(kra => (kra.kpis || []))
      .filter(kpi => kpi && kpi.status === status).length;
  };

  const kpiStatusData = [
    { name: 'On Track', value: safeKpiFilter('On Track') },
    { name: 'In Progress', value: safeKpiFilter('In Progress') },
    { name: 'At Risk', value: safeKpiFilter('At Risk') },
    { name: 'On Hold', value: safeKpiFilter('On Hold') },
    { name: 'Completed', value: safeKpiFilter('Completed') },
    { name: 'Not Started', value: safeKpiFilter('Not Started') },
  ];

  const kraPerformanceData = React.useMemo(() => {
      const statuses: Kpi['status'][] = ['On Track', 'In Progress', 'At Risk', 'On Hold', 'Completed', 'Not Started'];
      const data = statuses.map(status => ({
          name: status,
          value: validKras.filter(kra => getKraStatus(kra.kpis || []) === status).length
      }));
      return data.filter(d => d.value > 0);
  }, [validKras]);

  const progressTrendData = [
    { month: 'Jan', progress: 10 }, { month: 'Feb', progress: 25 }, { month: 'Mar', progress: 35 },
    { month: 'Apr', progress: 48 }, { month: 'May', progress: 52 }, { month: 'Jun', progress: 63 },
    { month: 'Jul', progress: 68 }, { month: 'Aug', progress: 72 }, { month: 'Sep', progress: 80 },
    { month: 'Oct', progress: 85 }, { month: 'Nov', progress: 90 }, { month: 'Dec', progress: 95 }
  ];

  const COLORS = ['#3b82f6', '#64748b', '#f59e0b', '#a855f7', '#10b981', '#94a3b8'];

  return (
    <div className="space-y-8 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>KRA Status Overview</CardTitle>
            <CardDescription>Overall KRA status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
               {kraPerformanceData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kraPerformanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name} (${value})`}
                    >
                      {kraPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} KRAs`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
               ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">No KRA data available.</div>
               )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>KPI Status Breakdown</CardTitle>
            <CardDescription>Status distribution of all individual KPIs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {kpiStatusData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={kpiStatusData.filter(d => d.value > 0)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={(value, name) => [`${value} KPIs`, name]} />
                    <Bar dataKey="value" name="KPIs">
                      {kpiStatusData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">No KPI data available.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Average KRA progress by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
             {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={departmentData}
                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Bar dataKey="value" name="Avg Progress" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No department data available.</div>
             )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Overall Progress Trend (Mock Data)</CardTitle>
            <CardDescription>Illustrative progress trajectory over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={progressTrendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                  <Area type="monotone" dataKey="progress" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
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