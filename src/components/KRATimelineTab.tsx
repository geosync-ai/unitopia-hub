import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Kra, Kpi } from '@/types/kpi';

interface KRATimelineTabProps {
  kras: Kra[];
}

const KRATimelineTab: React.FC<KRATimelineTabProps> = ({ kras }) => {
  const [currentViewMode, setCurrentViewMode] = useState<'quarters' | 'months' | 'weeks'>('quarters');

  // --- Preprocessing for Grouping --- 
  const firstObjectiveMap = new Map<string | number, string>();
  const firstKraTitleMap = new Map<string, string>(); // Key: objectiveId-kraTitle

  kras.forEach(kra => {
    // Track first occurrence of each objectiveId
    if (kra.objectiveId && !firstObjectiveMap.has(kra.objectiveId)) {
      firstObjectiveMap.set(kra.objectiveId, kra.id as string);
    }
    // Track first occurrence of each KRA title *within* an objective
    const kraTitleKey = `${kra.objectiveId}-${kra.title}`;
    if (kra.title && !firstKraTitleMap.has(kraTitleKey)) {
      firstKraTitleMap.set(kraTitleKey, kra.id as string);
    }
  });
  // --- End Preprocessing ---

  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weeks = Array.from({ length: 52 }, (_, i) => `W${i + 1}`);

  const parseDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  };

  const calculatePosition = (date: Date | null): number => {
    if (!date) return 0;
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDays = (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    const daysFromStart = (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
  };

  const calculateWidth = (startDate: Date | null, endDate: Date | null): number => {
    if (!startDate || !endDate || startDate >= endDate) return 0;
    const year = startDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDays = (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const width = (duration / totalDays) * 100;
    const startPosition = calculatePosition(startDate);
    return Math.max(0, Math.min(100 - startPosition, width));
  };

  const getKraProgress = (kpis: Kpi[]): number => {
    if (!kpis || kpis.length === 0) return 0;
    const totalTarget = kpis.reduce((sum, kpi) => sum + (Number(kpi.target) || 0), 0);
    if (totalTarget === 0) return 0;
    const totalActual = kpis.reduce((sum, kpi) => sum + (Number(kpi.actual) || 0), 0);
    const progress = Math.min(100, (totalActual / totalTarget) * 100);
    return Math.round(progress);
  };

  const getProgressColorClass = (progress: number): string => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-green-400";
    if (progress >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getKpiStatusColorClass = (status: Kpi['status']): string => {
    switch (status) {
      case 'completed': return "bg-blue-500";
      case 'on-track': return "bg-green-500";
      case 'in-progress': return "bg-green-400";
      case 'at-risk': return "bg-amber-500";
      case 'on-hold': return "bg-gray-400";
      case 'not-started': return "bg-gray-200";
      case 'behind': return "bg-red-500";
      default: return "bg-gray-300";
    }
  };

  // Helper function to get KPI progress percentage
  const getKpiProgress = (kpi: Kpi): number => {
    if (kpi.status === 'completed') return 100;
    const target = Number(kpi.target);
    const actual = Number(kpi.actual);
    if (target === 0 || isNaN(target) || isNaN(actual) || actual === undefined || actual === null) return 0;
    const progress = Math.min(100, Math.max(0, (actual / target) * 100));
    return Math.round(progress);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/images/scpng-logo.png" alt="SCPNG Logo" className="h-10 w-auto" />
            <CardTitle>Key Result Areas Timeline</CardTitle>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={currentViewMode === 'quarters' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewMode('quarters')}
              className="px-4"
            >
              Quarterly
            </Button>
            <Button
              variant={currentViewMode === 'months' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewMode('months')}
              className="px-4"
            >
              Monthly
            </Button>
            <Button
              variant={currentViewMode === 'weeks' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewMode('weeks')}
              className="px-4"
            >
              Weekly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 overflow-x-auto">
          <div className="timeline-view min-w-[1200px]">
            <div className="flex border-b border-gray-200 pb-2 sticky top-0 bg-background z-10">
              <div className="w-48 px-4 py-2 text-sm font-medium text-muted-foreground shrink-0">Objective</div>
              <div className="w-64 px-4 py-2 text-sm font-medium text-muted-foreground shrink-0">KRA Details</div>
              <div className="flex-1 flex">
                {currentViewMode === 'quarters' && quarters.map(quarter => (
                  <div key={quarter} className="flex-1 text-center text-sm font-medium text-gray-700">
                    {quarter}
                  </div>
                ))}
                {currentViewMode === 'months' && months.map(month => (
                  <div key={month} className="flex-1 text-center text-xs font-medium text-gray-700">
                    {month}
                  </div>
                ))}
                {currentViewMode === 'weeks' && (
                  <div className="flex w-full">
                    {weeks.map((week, i) => (
                      <div
                        key={week}
                        className="text-center text-xs font-medium text-gray-600"
                        style={{ width: '1.92%' }}
                      >
                        {i % 4 === 0 ? week : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-0 left-[calc(12rem+16rem)] right-0 h-full flex">
                {currentViewMode === 'quarters' && quarters.map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 border-r border-dashed border-gray-200"
                    style={{ 
                      borderRight: i < 3 ? '1px dashed #e5e7eb' : 'none'
                    }}
                  />
                ))}
                {currentViewMode === 'months' && months.map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 border-r border-dashed border-gray-200"
                    style={{ 
                      borderRight: i < 11 ? '1px dashed #e5e7eb' : 'none'
                    }}
                  />
                ))}
                {currentViewMode === 'weeks' && weeks.map((_, i) => (
                  <div
                    key={i}
                    className="border-r border-dashed border-gray-200"
                    style={{ 
                      borderRight: i < 51 ? '1px dashed #e5e7eb' : 'none',
                      width: '1.92%'
                    }}
                  />
                ))}
              </div>

              <div className="relative z-0">
                {kras.map((kra, kraIndex) => {
                  const kraStartDate = parseDate(kra.startDate);
                  const kraTargetDate = parseDate(kra.targetDate);
                  const kraProgress = getKraProgress(kra.unitKpis || []);
                  const kpisExist = kra.unitKpis && kra.unitKpis.length > 0;

                  // --- Grouping Checks ---
                  const isFirstForObjective = kra.objectiveId ? firstObjectiveMap.get(kra.objectiveId) === kra.id : false;
                  const kraTitleKey = `${kra.objectiveId}-${kra.title}`;
                  const isFirstForKraTitle = kra.title ? firstKraTitleMap.get(kraTitleKey) === kra.id : false;
                  // --- End Grouping Checks ---

                  return (
                    <div key={kra.id} className="flex items-start hover:bg-gray-50/50 relative">
                      {/* Objective Column - Render content only if first, add top border */}
                      <div className={`w-48 px-4 py-3 text-sm shrink-0 border-b border-gray-100 ${isFirstForObjective ? 'border-t border-gray-200' : ''}`}>
                        {isFirstForObjective && (
                          <span className="font-medium text-gray-900 block truncate">
                            {kra.unitObjectives?.title 
                              ? kra.unitObjectives.title 
                              : (kra.objectiveId ? `Obj ID: ${kra.objectiveId}` : 'N/A')
                            }
                          </span>
                        )}
                        {/* Render empty div if not first to maintain height/alignment */}
                        {!isFirstForObjective && <span>&nbsp;</span>}
                      </div>
                      {/* KRA Details Column - Render content only if first for title group, add top border */}
                      <div className={`w-64 px-4 py-3 shrink-0 border-b border-gray-100 ${isFirstForKraTitle ? 'border-t border-gray-200' : ''}`}>
                        {isFirstForKraTitle && (
                          <>
                            <div className="text-sm font-medium text-gray-900 block truncate">{kra.title}</div>
                            <div className="text-xs text-muted-foreground block truncate">{kra.unit || 'N/A'}</div>
                          </>
                        )}
                        {/* Render empty div if not first to maintain height/alignment */}
                        {!isFirstForKraTitle && <span>&nbsp;</span>}
                      </div>
                      {/* Timeline Bars Column */}
                      <div className={`flex-1 relative border-b border-gray-100 ${isFirstForObjective || isFirstForKraTitle ? 'border-t border-gray-200' : ''} ${kpisExist ? 'py-2' : 'h-16'}`}>
                        <>
                          {kra.unitKpis && kra.unitKpis.map((kpi, kpiIndex) => {
                            const kpiStartDate = parseDate(kpi.startDate);
                            const kpiTargetDate = parseDate(kpi.targetDate);
                            const kpiStartPosition = calculatePosition(kpiStartDate);
                            const kpiWidth = calculateWidth(kpiStartDate, kpiTargetDate);
                            const kpiColorClass = getKpiStatusColorClass(kpi.status);
                            const kpiProgress = getKpiProgress(kpi);

                            if (!kpiStartDate || !kpiTargetDate || kpiWidth <= 0) {
                              return <React.Fragment key={kpi.id || `kpi-${kraIndex}-${kpiIndex}-frag`}></React.Fragment>; // Use Fragment with key
                            }

                            return (
                              <Tooltip key={kpi.id || `kpi-${kraIndex}-${kpiIndex}`} delayDuration={100}>
                                <TooltipTrigger asChild>
                                  {/* Outer div: Positions the bar, acts as track */}
                                  <div
                                    className={`absolute h-5 rounded-full bg-gray-200 shadow-sm overflow-hidden`}
                                    style={{
                                      left: `${kpiStartPosition}%`,
                                      width: `${kpiWidth}%`,
                                      top: `${1 + kpiIndex * 1.75}rem`, // Stack KPIs vertically
                                      zIndex: 10 + kpiIndex, // Ensure stacking order
                                    }}
                                  >
                                    {/* Inner div: Shows progress with status color */}
                                    <div
                                      className={`absolute top-0 left-0 h-full rounded-full ${kpiColorClass} transition-all duration-300`}
                                      style={{ width: `${kpiProgress}%` }}
                                    />
                                    {/* KPI Name Label: Positioned above progress */}
                                    <span className="absolute inset-0 flex items-center text-xs text-white font-medium px-2 truncate z-10">
                                      {kpi.name}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center">
                                  <p className="font-semibold">{kpi.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {kpi.startDate ? new Date(kpi.startDate).toLocaleDateString() : '?'} - {kpi.targetDate ? new Date(kpi.targetDate).toLocaleDateString() : '?'}
                                  </p>
                                  <p className="text-xs">Status: {kpi.status}</p>
                                  <p className="text-xs">Progress: {kpiProgress}%</p>
                                  {kpi.target !== undefined && <p className="text-xs">Target: {kpi.target}</p>}
                                  {kpi.actual !== undefined && <p className="text-xs">Actual: {kpi.actual}</p>}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </>
                        {(!kra.unitKpis || kra.unitKpis.length === 0) && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground" style={{ left: '0%', width: '100%', top: '1rem' }}>
                            No KPIs defined for this KRA.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {kras.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">No KRAs to display.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>2023 Fiscal Year</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>On Track (75-100%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>At Risk (50-74%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Behind (&lt;50%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KRATimelineTab; 