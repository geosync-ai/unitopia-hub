
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, Minus, Target, Flag, Award, BarChart2, TrendingUp, Clock } from 'lucide-react';

const Organization = () => {
  // Mock data for Mission and Vision
  const orgMission = "To provide world-class digital infrastructure, AI-driven solutions and support services that empower our customers to achieve their business objectives.";
  
  const orgVision = "To be the leading provider of innovative digital solutions in the Asia-Pacific region, recognized for excellence, integrity and customer-centric approach.";
  
  const orgValues = [
    { name: "Excellence", description: "Pursuing the highest standards in everything we do" },
    { name: "Innovation", description: "Embracing creativity and forward-thinking solutions" },
    { name: "Integrity", description: "Upholding ethical standards and transparency" },
    { name: "Collaboration", description: "Working together to achieve common goals" },
    { name: "Customer Focus", description: "Putting customer needs at the center of our decisions" },
  ];
  
  // Mock data for KPIs
  const kpiData = [
    { 
      id: 1, 
      area: "Financial", 
      kpi: "Revenue Growth", 
      target: "15%", 
      current: "12%", 
      status: "on-track",
      progress: 80,
    },
    { 
      id: 2, 
      area: "Financial", 
      kpi: "Cost Reduction", 
      target: "8%", 
      current: "5%", 
      status: "needs-attention",
      progress: 62,
    },
    { 
      id: 3, 
      area: "Customers", 
      kpi: "Customer Satisfaction", 
      target: "90%", 
      current: "86%", 
      status: "on-track",
      progress: 95,
    },
    { 
      id: 4, 
      area: "Customers", 
      kpi: "New Clients", 
      target: "50", 
      current: "38", 
      status: "on-track",
      progress: 76,
    },
    { 
      id: 5, 
      area: "Internal Processes", 
      kpi: "Project Delivery On Time", 
      target: "95%", 
      current: "82%", 
      status: "at-risk",
      progress: 58,
    },
    { 
      id: 6, 
      area: "Innovation", 
      kpi: "New Products Launched", 
      target: "5", 
      current: "3", 
      status: "on-track",
      progress: 90,
    },
    { 
      id: 7, 
      area: "People", 
      kpi: "Employee Engagement", 
      target: "85%", 
      current: "78%", 
      status: "on-track",
      progress: 85,
    },
    { 
      id: 8, 
      area: "People", 
      kpi: "Training Hours per Employee", 
      target: "40 hrs", 
      current: "28 hrs", 
      status: "needs-attention",
      progress: 70,
    },
  ];
  
  // Strategic objectives
  const strategicObjectives = [
    {
      id: 1,
      title: "Expand Market Presence",
      description: "Increase market share across Australia and expand into New Zealand and Southeast Asia.",
      goals: [
        "Establish 3 new regional offices by Q4",
        "Acquire 100 new enterprise clients",
        "Launch localized marketing campaigns in 5 countries"
      ],
      icon: TrendingUp,
      progress: 65
    },
    {
      id: 2,
      title: "Enhance Product Portfolio",
      description: "Develop and launch innovative products that meet evolving customer needs.",
      goals: [
        "Launch 5 new product offerings",
        "Upgrade 3 existing platforms",
        "Establish 2 strategic technology partnerships"
      ],
      icon: Award,
      progress: 42
    },
    {
      id: 3,
      title: "Operational Excellence",
      description: "Optimize internal processes to improve efficiency and reduce costs.",
      goals: [
        "Implement enterprise-wide automation",
        "Reduce operational costs by 8%",
        "Improve project delivery time by 15%"
      ],
      icon: BarChart2,
      progress: 78
    },
    {
      id: 4,
      title: "Talent Development",
      description: "Build a high-performing workforce through recruitment, training and retention.",
      goals: [
        "Reduce turnover rate to below 10%",
        "Implement leadership development program",
        "Establish technical certification program"
      ],
      icon: Target,
      progress: 58
    },
  ];

  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Organizational Overview</h1>
        <p className="text-gray-500">Strategic direction, performance metrics and corporate objectives</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="gradient-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-intranet-primary" />
              Mission & Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 text-intranet-primary">Our Mission</h3>
              <p className="text-gray-700 dark:text-gray-300">{orgMission}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-intranet-primary">Our Vision</h3>
              <p className="text-gray-700 dark:text-gray-300">{orgVision}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-intranet-primary">Our Values</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {orgValues.map((value, index) => (
                  <li key={index} className="flex flex-col p-3 border rounded-md hover:bg-accent/50 transition-colors">
                    <span className="font-medium">{value.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{value.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-6">
          {strategicObjectives.map((objective, index) => (
            <Card key={objective.id} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${0.1 + index * 0.1}s` }}>
              <div className="flex">
                <div className="w-2 bg-gradient-to-b from-intranet-primary to-intranet-secondary h-full"></div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-intranet-primary/10">
                        <objective.icon className="h-5 w-5 text-intranet-primary" />
                      </div>
                      <h3 className="font-semibold">{objective.title}</h3>
                    </div>
                    <div className="text-sm font-medium">
                      {objective.progress}%
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{objective.description}</p>
                  
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between items-center text-xs text-gray-500">
                      <span>Progress</span>
                      <Clock className="h-3 w-3" />
                    </div>
                    <Progress value={objective.progress} className="h-2" />
                  </div>
                  
                  <div className="mt-3 text-sm">
                    <div className="font-medium text-xs mb-1">Key goals:</div>
                    <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      {objective.goals.map((goal, idx) => (
                        <li key={idx}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-intranet-primary" />
            Key Performance Indicators (KPIs)
          </CardTitle>
          <CardDescription>
            Tracking our performance against strategic goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key Result Area</TableHead>
                <TableHead>KPI</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiData.map((kpi, index) => (
                <TableRow key={kpi.id} className="table-row-hover animate-fade-in" style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
                  <TableCell className="font-medium">{kpi.area}</TableCell>
                  <TableCell>{kpi.kpi}</TableCell>
                  <TableCell>{kpi.target}</TableCell>
                  <TableCell>{kpi.current}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {kpi.status === 'on-track' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-green-600 text-sm">On Track</span>
                        </>
                      )}
                      {kpi.status === 'needs-attention' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          <span className="text-yellow-600 text-sm">Needs Attention</span>
                        </>
                      )}
                      {kpi.status === 'at-risk' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="text-red-600 text-sm">At Risk</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full max-w-[200px]">
                      <div className="flex justify-between mb-1 text-xs">
                        <span>{kpi.progress}%</span>
                      </div>
                      <Progress 
                        value={kpi.progress} 
                        className="h-2"
                        indicatorClassName={
                          kpi.status === 'on-track' 
                            ? 'bg-green-500' 
                            : kpi.status === 'needs-attention' 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Organization;
