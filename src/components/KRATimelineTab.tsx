import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface KPI {
  id: string;
  name: string;
  date: Date;
  target: string | number;
  actual: string | number;
  status: string;
  description?: string;
  notes?: string;
}

interface KRA {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  department: string;
  responsible: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'open' | 'in-progress' | 'closed';
  kpis: KPI[];
  createdAt?: string;
  updatedAt?: string;
}

interface KRATimelineTabProps {
  kras: KRA[];
}

const KRATimelineTab: React.FC<KRATimelineTabProps> = ({ kras }) => {
  const [currentViewMode, setCurrentViewMode] = useState<'quarters' | 'months' | 'weeks'>('quarters');
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);

  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weeks = Array.from({ length: 52 }, (_, i) => `W${i + 1}`);

  // Helper functions
  const calculatePosition = (date: Date) => {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDays = (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    const daysFromStart = (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
  };

  const calculateWidth = (startDate: Date, endDate: Date) => {
    const year = startDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDays = (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const width = (duration / totalDays) * 100;
    return Math.max(0, Math.min(100 - calculatePosition(startDate), width));
  };

  const getProgressColorClass = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-green-400";
    if (progress >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getKpiStatusColor = (status: string) => {
    switch(status) {
      case "Completed": return "#10b981";
      case "On Track": return "#3b82f6";
      case "At Risk": return "#f59e0b";
      case "Behind": return "#ef4444";
      case "Not Started": return "#9ca3af";
      default: return "#6b7280";
    }
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
          <div className="timeline-view">
            {/* Timeline header */}
            <div className="flex border-b border-gray-200 pb-2">
              <div className="w-48 px-4 py-2 text-sm font-medium text-gray-700">Objectives</div>
              <div className="w-64 px-4 py-2 text-sm font-medium text-gray-700">KRA Details</div>
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

            {/* Timeline grid */}
            <div className="relative">
              <div className="absolute top-0 left-64 right-0 h-full flex">
                {currentViewMode === 'quarters' && quarters.map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 border-r border-dashed border-gray-200"
                    style={{ 
                      left: `${i * 25}%`,
                      height: '100%',
                      position: 'absolute',
                      borderRight: i < 3 ? '1px dashed #e5e7eb' : 'none'
                    }}
                  />
                ))}
                {currentViewMode === 'months' && months.map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 border-r border-dashed border-gray-200"
                    style={{ 
                      left: `${(i * 100) / 12}%`,
                      height: '100%',
                      position: 'absolute',
                      borderRight: i < 11 ? '1px dashed #e5e7eb' : 'none'
                    }}
                  />
                ))}
                {currentViewMode === 'weeks' && weeks.map((_, i) => (
                  <div
                    key={i}
                    className="border-r border-dashed border-gray-200"
                    style={{ 
                      left: `${(i * 100) / 52}%`,
                      height: '100%',
                      position: 'absolute',
                      borderRight: i < 51 ? '1px dashed #e5e7eb' : 'none',
                      width: '1.92%'
                    }}
                  />
                ))}
              </div>

              {/* KRA rows */}
              <div>
                {kras.map(kra => (
                  <div key={kra.id} className="flex items-start hover:bg-gray-50 relative" style={{ minHeight: '4rem' }}>
                    <div className="w-48 px-4 py-2 text-sm">
                      <span className="font-medium text-gray-900">{kra.objectiveName}</span>
                    </div>
                    <div className="w-64 px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">{kra.name}</div>
                      <div className="text-xs text-gray-500">{kra.department}</div>
                    </div>
                    <div className="flex-1 relative px-2">
                      <div
                        className="absolute h-8 rounded-md shadow-sm flex items-center overflow-hidden"
                        style={{
                          left: `${calculatePosition(kra.startDate)}%`,
                          width: `${calculateWidth(kra.startDate, kra.endDate)}%`,
                          top: '8px',
                          background: 'linear-gradient(to right, #e0f2fe, #bfdbfe)'
                        }}
                      >
                        <div
                          className={`h-full rounded-l-md ${getProgressColorClass(kra.progress)}`}
                          style={{ width: `${kra.progress}%`, opacity: 0.8 }}
                        />
                        <span className="absolute right-2 text-xs font-medium text-gray-700">
                          {kra.progress}%
                        </span>
                        
                        {kra.kpis.map(kpi => {
                          const kpiPosition = calculatePosition(kpi.date);
                          const relativePosition = (kpiPosition - calculatePosition(kra.startDate)) / calculateWidth(kra.startDate, kra.endDate) * 100;
                          
                          if (relativePosition >= 0 && relativePosition <= 100) {
                            return (
                              <div key={kpi.id} className="contents">
                                <div
                                  className="absolute w-3 h-3 rounded-full bg-white border-2 cursor-pointer"
                                  style={{
                                    left: `${relativePosition}%`,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    borderColor: getKpiStatusColor(kpi.status)
                                  }}
                                  onClick={() => setSelectedKPI(kpi)}
                                />
                                <div
                                  className="absolute text-xs font-medium whitespace-nowrap cursor-pointer"
                                  style={{
                                    left: `${relativePosition}%`,
                                    top: '-20px',
                                    transform: 'translateX(-50%)',
                                    color: getKpiStatusColor(kpi.status)
                                  }}
                                  onClick={() => setSelectedKPI(kpi)}
                                >
                                  {kpi.name}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
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

      <Dialog open={!!selectedKPI} onOpenChange={() => setSelectedKPI(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedKPI?.name}</DialogTitle>
          </DialogHeader>
          {selectedKPI && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 font-medium">Status</div>
                  <div className="font-medium" style={{ color: getKpiStatusColor(selectedKPI.status) }}>
                    {selectedKPI.status}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium">Date</div>
                  <div>{selectedKPI.date.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium">Target</div>
                  <div>{selectedKPI.target}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium">Actual</div>
                  <div>{selectedKPI.actual}</div>
                </div>
              </div>
              <div>
                <div className="text-gray-500 font-medium mt-3">Description</div>
                <div>{selectedKPI.description || 'No description available'}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium mt-3">Notes</div>
                <div>{selectedKPI.notes || 'No notes available'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default KRATimelineTab; 