
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target, Compass, Flag, BarChart2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const OrganizationalOverview = () => {
  // Mock data
  const orgMission = "To provide world-class digital infrastructure, AI-driven solutions and support services that empower our customers to achieve their business objectives.";
  
  const orgVision = "To be the leading provider of innovative digital solutions in the Asia-Pacific region, recognized for excellence, integrity and customer-centric approach.";
  
  const orgValues = [
    { name: "Excellence", progress: 85 },
    { name: "Innovation", progress: 78 },
    { name: "Integrity", progress: 92 },
    { name: "Collaboration", progress: 81 }
  ];
  
  const orgObjectives = [
    { name: "Expand Market Presence", progress: 65 },
    { name: "Enhance Product Portfolio", progress: 42 },
    { name: "Operational Excellence", progress: 78 },
    { name: "Talent Development", progress: 58 },
  ];

  return (
    <Card className="bg-gradient-to-br from-card to-muted/80 shadow-md animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Compass className="h-5 w-5 text-intranet-primary" />
          Organizational Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1 mb-1">
                <Flag className="h-4 w-4 text-intranet-primary" />
                Our Mission
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">{orgMission}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1 mb-1">
                <Target className="h-4 w-4 text-intranet-primary" />
                Our Vision
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">{orgVision}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1 mb-1">
                <BarChart2 className="h-4 w-4 text-intranet-primary" />
                Core Values Performance
              </h3>
              <div className="space-y-2">
                {orgValues.map((value, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{value.name}</span>
                      <span>{value.progress}%</span>
                    </div>
                    <Progress value={value.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1 mb-1">
                <Target className="h-4 w-4 text-intranet-primary" />
                Strategic Objectives
              </h3>
              <div className="space-y-2">
                {orgObjectives.map((objective, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{objective.name}</span>
                      <span>{objective.progress}%</span>
                    </div>
                    <Progress value={objective.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationalOverview;
