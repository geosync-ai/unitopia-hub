import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, PenSquare, Share, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Report, ReportSectionContent } from '@/types/reports';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ReportPreviewProps {
  report: Report | null;
  isLoading: boolean;
  onEdit?: (sectionId: string) => void;
  onShare?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onDuplicate?: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  isLoading,
  onEdit,
  onShare,
  onDownload,
  onPrint,
  onDuplicate
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [sections, setSections] = useState<ReportSectionContent[]>([]);

  useEffect(() => {
    if (report?.content?.sections) {
      setSections(report.content.sections);
    }
  }, [report]);

  const handleNextSection = () => {
    if (activeTabIndex < sections.length - 1) {
      setActiveTabIndex(activeTabIndex + 1);
    }
  };

  const handlePreviousSection = () => {
    if (activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  // Function to render the appropriate visualization for a section
  const renderVisualization = (section: ReportSectionContent) => {
    if (!section.visualization) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          No visualization available for this section
        </div>
      );
    }

    switch (section.visualization.type) {
      case 'table':
        return renderTableVisualization(section);
      case 'chart':
        return renderChartVisualization(section);
      case 'metrics':
        return renderMetricsVisualization(section);
      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            Visualization type not supported
          </div>
        );
    }
  };

  // Render table visualization
  const renderTableVisualization = (section: ReportSectionContent) => {
    if (!section.data || section.data.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          No data available for table visualization
        </div>
      );
    }

    // Extract column headers from the first data item
    const columns = Object.keys(section.data[0]);

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              {columns.map(column => (
                <th key={column} className="p-2 text-left font-medium text-muted-foreground">
                  {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.data.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                {columns.map(column => (
                  <td key={`${index}-${column}`} className="p-2 border-t">
                    {renderCellValue(item[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to render cell values appropriately
  const renderCellValue = (value: any) => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      
      return JSON.stringify(value);
    }
    
    return value.toString();
  };

  // Render chart visualization placeholder
  // In a real implementation, you would integrate a charting library like Chart.js or Recharts
  const renderChartVisualization = (section: ReportSectionContent) => {
    return (
      <div className="p-8 border rounded-md bg-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Chart Visualization</div>
          <p className="text-muted-foreground">
            {section.visualization?.chart_type || 'Bar'} chart would be rendered here using actual data
          </p>
        </div>
      </div>
    );
  };

  // Render metrics visualization
  const renderMetricsVisualization = (section: ReportSectionContent) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {section.data.map((metric, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{metric.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{metric.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render AI insights if available
  const renderAIInsights = () => {
    if (!report?.ai_insights) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          No AI insights available for this report
        </div>
      );
    }

    return (
      <div className="space-y-6 p-4">
        {report.ai_insights.trends && report.ai_insights.trends.length > 0 && (
          <div>
            <h3 className="font-medium text-lg mb-2">Performance Trends</h3>
            <ul className="list-disc pl-5 space-y-1">
              {report.ai_insights.trends.map((trend, index) => (
                <li key={index}>{trend}</li>
              ))}
            </ul>
          </div>
        )}
        
        {report.ai_insights.risks && report.ai_insights.risks.length > 0 && (
          <div>
            <h3 className="font-medium text-lg mb-2">Risk Identification</h3>
            <ul className="list-disc pl-5 space-y-1">
              {report.ai_insights.risks.map((risk, index) => (
                <li key={index}>{risk}</li>
              ))}
            </ul>
          </div>
        )}
        
        {report.ai_insights.recommendations && report.ai_insights.recommendations.length > 0 && (
          <div>
            <h3 className="font-medium text-lg mb-2">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-1">
              {report.ai_insights.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        )}
        
        {report.ai_insights.predictions && report.ai_insights.predictions.length > 0 && (
          <div>
            <h3 className="font-medium text-lg mb-2">Predictions</h3>
            <ul className="list-disc pl-5 space-y-1">
              {report.ai_insights.predictions.map((prediction, index) => (
                <li key={index}>{prediction}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center space-x-2 mt-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-[400px] w-full mt-4" />
      </div>
    );
  }

  // No report state
  if (!report) {
    return (
      <div className="flex items-center justify-center h-[400px] border rounded-md bg-muted/20">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Report Selected</h3>
          <p className="text-muted-foreground">Select a report to preview or generate a new report</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{report.name}</h2>
          <p className="text-muted-foreground">
            Generated on {new Date(report.created_at).toLocaleDateString()}
            {report.date_range && (
              <> · Data range: {new Date(report.date_range.start_date).toLocaleDateString()} - {new Date(report.date_range.end_date).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button variant="outline" size="icon" onClick={() => onEdit(sections[activeTabIndex]?.id || '')}>
              <PenSquare className="h-4 w-4" />
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="icon" onClick={onShare}>
              <Share className="h-4 w-4" />
            </Button>
          )}
          {onDuplicate && (
            <Button variant="outline" size="icon" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="icon" onClick={onDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onPrint && (
            <Button variant="outline" size="icon" onClick={onPrint}>
              <Printer className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {report.ai_analysis && (
        <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 text-primary">AI Enhanced</Badge>
      )}

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Report Content</TabsTrigger>
          {report.ai_analysis && (
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="content" className="mt-4">
          {sections.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePreviousSection}
                  disabled={activeTabIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Section {activeTabIndex + 1} of {sections.length}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleNextSection}
                  disabled={activeTabIndex === sections.length - 1}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>{sections[activeTabIndex]?.title}</CardTitle>
                  {sections[activeTabIndex]?.summary && (
                    <CardDescription>{sections[activeTabIndex].summary}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {renderVisualization(sections[activeTabIndex])}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] border rounded-md bg-muted/20">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No Sections Available</h3>
                <p className="text-muted-foreground">This report doesn't contain any sections</p>
              </div>
            </div>
          )}
        </TabsContent>
        
        {report.ai_analysis && (
          <TabsContent value="insights" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis & Insights</CardTitle>
                <CardDescription>
                  Automated analysis of report data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderAIInsights()}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ReportPreview; 