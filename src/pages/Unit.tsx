import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, ArrowDown, Minus, Target, Flag, Award, BarChart2, TrendingUp, Clock } from 'lucide-react';

interface MetricData {
  id: number;
  name: string;
  target: string;
  current: string;
  status: 'on-track' | 'needs-attention' | 'at-risk';
  progress: number;
}

const Unit = () => {
  const [activeTab, setActiveTab] = useState('kpis');
  const [selectedUnit, setSelectedUnit] = useState('all');

  // Mock data for units
  const units = [
    { id: 'all', name: 'All Units' },
    { id: 'sales', name: 'Sales' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'development', name: 'Development' },
    { id: 'support', name: 'Support' },
  ];

  // Mock data for KPIs
  const kpiData: MetricData[] = [
    { 
      id: 1, 
      name: "Revenue Growth", 
      target: "15%", 
      current: "12%", 
      status: "on-track",
      progress: 80,
    },
    { 
      id: 2, 
      name: "Customer Satisfaction", 
      target: "90%", 
      current: "86%", 
      status: "on-track",
      progress: 95,
    },
    { 
      id: 3, 
      name: "Project Delivery On Time", 
      target: "95%", 
      current: "82%", 
      status: "at-risk",
      progress: 58,
    },
  ];

  // Mock data for KRAs
  const kraData: MetricData[] = [
    { 
      id: 1, 
      name: "Market Share", 
      target: "25%", 
      current: "22%", 
      status: "on-track",
      progress: 88,
    },
    { 
      id: 2, 
      name: "Product Quality", 
      target: "98%", 
      current: "95%", 
      status: "needs-attention",
      progress: 75,
    },
    { 
      id: 3, 
      name: "Team Productivity", 
      target: "85%", 
      current: "78%", 
      status: "on-track",
      progress: 82,
    },
  ];

  // Mock data for Objectives
  const objectivesData: MetricData[] = [
    { 
      id: 1, 
      name: "Expand Market Presence", 
      target: "3 new regions", 
      current: "2 regions", 
      status: "on-track",
      progress: 66,
    },
    { 
      id: 2, 
      name: "Product Innovation", 
      target: "5 new features", 
      current: "3 features", 
      status: "needs-attention",
      progress: 60,
    },
    { 
      id: 3, 
      name: "Team Development", 
      target: "100% certified", 
      current: "85% certified", 
      status: "on-track",
      progress: 85,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'needs-attention':
        return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'at-risk':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const renderMetricsTable = (data: MetricData[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Current</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((metric) => (
          <TableRow key={metric.id}>
            <TableCell className="font-medium">{metric.name}</TableCell>
            <TableCell>{metric.target}</TableCell>
            <TableCell>{metric.current}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusIcon(metric.status)}
                <span className="capitalize">{metric.status.replace('-', ' ')}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={metric.progress} className="w-[60px]" />
                <span className="text-sm">{metric.progress}%</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Unit Performance Dashboard</h1>
        <p className="text-gray-500">Track and manage unit-level KPIs, KRAs, and objectives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Performance Metrics</CardTitle>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="kpis">KPIs</TabsTrigger>
                  <TabsTrigger value="kras">KRAs</TabsTrigger>
                  <TabsTrigger value="objectives">Objectives</TabsTrigger>
                </TabsList>
                <TabsContent value="kpis">
                  {renderMetricsTable(kpiData)}
                </TabsContent>
                <TabsContent value="kras">
                  {renderMetricsTable(kraData)}
                </TabsContent>
                <TabsContent value="objectives">
                  {renderMetricsTable(objectivesData)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Update Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metric-type">Metric Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kpi">KPI</SelectItem>
                      <SelectItem value="kra">KRA</SelectItem>
                      <SelectItem value="objective">Objective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metric-name">Metric Name</Label>
                  <Input id="metric-name" placeholder="Enter metric name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Target Value</Label>
                  <Input id="target" placeholder="Enter target value" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current">Current Value</Label>
                  <Input id="current" placeholder="Enter current value" />
                </div>

                <Button className="w-full">Update Metric</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Unit; 