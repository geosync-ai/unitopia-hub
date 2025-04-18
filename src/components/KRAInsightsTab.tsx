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
  Area,
  LabelList
} from 'recharts';
import { useTheme } from "next-themes";

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

const getKraStatus = (kpis: Kpi[]): string => {
  if (!kpis || kpis.length === 0) return 'Not Started';
  if (kpis.some(kpi => kpi.status === 'at-risk')) return 'At Risk';
  if (kpis.some(kpi => kpi.status === 'behind')) return 'Behind';
  if (kpis.some(kpi => kpi.status === 'on-hold')) return 'On Hold';
  if (kpis.some(kpi => kpi.status === 'in-progress')) return 'In Progress';
  if (kpis.some(kpi => kpi.status === 'on-track')) return 'On Track';
  if (kpis.every(kpi => kpi.status === 'completed')) return 'Completed';
  return 'Not Started';
};

const themeColors = {
  primary: '#400010',
  secondary: '#600018',
  accent: '#E11D48',
  neutral: '#64748b',
  background: '#ffffff',
  foreground: '#0f172a'
};

const statusColors: Record<string, string> = {
  'Completed': themeColors.primary,
  'On Track': '#10b981',
  'In Progress': '#3b82f6',
  'Pending': themeColors.neutral,
  'Not Started': themeColors.neutral,
  'On Hold': '#f59e0b',
  'At Risk': themeColors.accent,
  'Behind': '#ef4444',
};

export const KRAInsightsTab: React.FC<KRAInsightsTabProps> = ({ kras }) => {
  const validKras = Array.isArray(kras) ? kras : [];
  const { theme } = useTheme();

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

  const kpiStatusData = React.useMemo(() => {
    const statusCounts: Record<string, number> = {};
    validKras.flatMap(kra => (kra.unitKpis || [])).forEach(kpi => {
      if (kpi?.status) {
        statusCounts[kpi.status] = (statusCounts[kpi.status] || 0) + 1;
      }
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [validKras]);

  const kraStatusData = React.useMemo(() => {
    const statusCounts: Record<string, number> = {};
    validKras.forEach(kra => {
      const status = getKraStatus(kra.unitKpis || []);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [validKras]);

  const progressTrendData = [
    { month: 'Jan', progress: 10 }, { month: 'Feb', progress: 25 }, { month: 'Mar', progress: 35 },
    { month: 'Apr', progress: 48 }, { month: 'May', progress: 52 }, { month: 'Jun', progress: 63 },
    { month: 'Jul', progress: 68 }, { month: 'Aug', progress: 72 }, { month: 'Sep', progress: 80 },
    { month: 'Oct', progress: 85 }, { month: 'Nov', progress: 90 }, { month: 'Dec', progress: 95 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {payload[0].name || label}
              </span>
              <span className="font-bold text-muted-foreground">
                {payload[0].value}{payload[0].unit}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>KRA Status Overview</CardTitle>
            <CardDescription>Overall KRA status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
               {kraStatusData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                    </defs>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={kraStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                    >
                      {kraStatusData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={statusColors[entry.name] || themeColors.neutral} stroke={themeColors.background} />
                      ))}
                    </Pie>
                     <Legend 
                       verticalAlign="bottom" 
                       height={36}
                       iconType="circle"
                       formatter={(value, entry) => <span style={{ color: themeColors.foreground }}>{value}</span>}
                      />
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
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    barGap={4}
                    barSize={12}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={themeColors.neutral} strokeOpacity={0.3}/>
                    <XAxis type="number" allowDecimals={false} stroke={themeColors.neutral} fontSize={12} />
                    <YAxis type="category" dataKey="name" width={80} stroke={themeColors.neutral} fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" name="KPIs" radius={[0, 4, 4, 0]}>
                      {kpiStatusData.filter(d => d.value > 0).map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={statusColors[entry.name] || themeColors.neutral} />
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
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  barGap={4} 
                  barSize={12} 
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={themeColors.neutral} strokeOpacity={0.3} />
                  <XAxis type="number" domain={[0, 100]} unit="%" stroke={themeColors.neutral} fontSize={12} />
                  <YAxis type="category" dataKey="name" width={80} stroke={themeColors.neutral} fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip unit="%"/>} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" name="Avg Progress" fill={themeColors.secondary} radius={[0, 4, 4, 0]} />
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
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                   <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.neutral} strokeOpacity={0.3} />
                  <XAxis dataKey="month" stroke={themeColors.neutral} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} unit="%" stroke={themeColors.neutral} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unit="%"/>} cursor={false} />
                  <Area 
                    type="monotone" 
                    dataKey="progress" 
                    stroke={themeColors.primary} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#progressGradient)" 
                    dot={false}
                   />
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