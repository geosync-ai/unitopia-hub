import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Kra, Kpi, User } from '@/types/kpi';
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
  LabelList
} from 'recharts';
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();

  console.log('[KRAInsightsTab] User:', JSON.stringify(user, null, 2));
  console.log('[KRAInsightsTab] Received kras data:', JSON.stringify(validKras, null, 2));

  const userOwnedKras = React.useMemo(() => {
    if (!user?.id) {
      console.log('[KRAInsightsTab] No user ID found for KRA filtering.');
      return [];
    }
    console.log(`[KRAInsightsTab] Filtering KRAs for owner ID: ${user.id}`);
    const filtered = validKras.filter(kra => {
      return kra.owner?.id === user.id;
    });
    console.log('[KRAInsightsTab] Filtered userOwnedKras:', filtered);
    return filtered;
  }, [validKras, user?.id]);

  const userAssignedKpis = React.useMemo(() => {
    if (!user?.id) {
      console.log('[KRAInsightsTab] No user ID found for KPI filtering.');
      return [];
    }
    console.log(`[KRAInsightsTab] Filtering KPIs for assignee ID: ${user.id}`);
    const assignedKpis = validKras.flatMap(kra => kra.unitKpis || [])
                    .filter(kpi => {
                      return Array.isArray(kpi.assignees) && kpi.assignees.some(assignee => assignee?.id === user.id);
                    });
    console.log('[KRAInsightsTab] Filtered userAssignedKpis:', assignedKpis);
    return assignedKpis;
  }, [validKras, user?.id]);

  const userKraStatusData = React.useMemo(() => {
    const statusCounts: Record<string, number> = {};
    userOwnedKras.forEach(kra => {
      const status = getKraStatus(kra.unitKpis || []);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('[KRAInsightsTab] Calculated userKraStatusData:', statusCounts);
    return Object.entries(statusCounts)
           .map(([name, value]) => ({ name, value }))
           .filter(d => d.value > 0);
  }, [userOwnedKras]);

  const userKpiStatusData = React.useMemo(() => {
    const statusCounts: Record<string, number> = {};
    userAssignedKpis.forEach(kpi => {
      if (kpi?.status) {
        statusCounts[kpi.status] = (statusCounts[kpi.status] || 0) + 1;
      }
    });
    console.log('[KRAInsightsTab] Calculated userKpiStatusData:', statusCounts);
    return Object.entries(statusCounts)
            .map(([name, value]) => ({ name, value }))
            .filter(d => d.value > 0);
  }, [userAssignedKpis]);

  const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
          <p className="font-medium mb-1">{label || payload[0].name}</p>
          <p className="text-muted-foreground">
             <span style={{ color: payload[0].payload?.fill || payload[0].color }}>■</span> {payload[0].name}: 
             <span className="font-bold ml-1">{payload[0].value}{unit || ''}</span>
           </p>
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
            <CardTitle>Your KRA Status Overview</CardTitle>
            <CardDescription>Status distribution of KRAs you own</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
               {userKraStatusData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={userKraStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                    >
                      {userKraStatusData.map((entry) => (
                        <Cell key={`cell-kra-${entry.name}`} fill={statusColors[entry.name] || themeColors.neutral} stroke={themeColors.background} />
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
                 <div className="flex items-center justify-center h-full text-muted-foreground">You do not own any KRAs.</div>
               )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Your Assigned KPI Status</CardTitle>
            <CardDescription>Status distribution of KPIs assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {userKpiStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={userKpiStatusData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    barGap={4} 
                    barSize={12} 
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={themeColors.neutral} strokeOpacity={0.3}/>
                    <XAxis type="number" allowDecimals={false} stroke={themeColors.neutral} fontSize={12} />
                    <YAxis type="category" dataKey="name" width={80} stroke={themeColors.neutral} fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" name="KPIs" radius={[0, 4, 4, 0]}> 
                      {userKpiStatusData.map((entry) => (
                        <Cell key={`cell-kpi-${entry.name}`} fill={statusColors[entry.name] || themeColors.neutral} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">No KPIs assigned to you.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KRAInsightsTab;