
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BarChart, PieChart, LineChart, ListChecks, Wrench, CalendarClock, Undo, Info } from "lucide-react";

export function AssetDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Actionable Alerts Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-intranet-primary">
              <Bell size={18} className="mr-2" />
              Actionable Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 pb-2 border-b">
                <Wrench size={16} className="mt-1 text-amber-500 flex-shrink-0" />
                <span>Server Rack 01 - Maintenance due this week</span>
              </li>
              <li className="flex items-start gap-2 pb-2 border-b">
                <CalendarClock size={16} className="mt-1 text-amber-500 flex-shrink-0" />
                <span>Laptop XYZ - Warranty expiring soon (15 days)</span>
              </li>
              <li className="flex items-start gap-2 pb-2 border-b">
                <Undo size={16} className="mt-1 text-red-500 flex-shrink-0" />
                <span>Projector P03 - Overdue return (User: J. Doe)</span>
              </li>
              <li className="flex items-start gap-2">
                <Info size={16} className="mt-1 text-blue-500 flex-shrink-0" />
                <span>3 Assets awaiting disposal</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Assets by Category Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-intranet-primary">
              <BarChart size={18} className="mr-2" />
              Assets by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 border border-gray-200 rounded-md h-52 flex items-center justify-center text-muted-foreground">
              Bar Chart Placeholder
            </div>
          </CardContent>
        </Card>

        {/* Assets by Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-intranet-primary">
              <PieChart size={18} className="mr-2" />
              Assets by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 border border-gray-200 rounded-md h-52 flex items-center justify-center text-muted-foreground">
              Pie Chart Placeholder
            </div>
          </CardContent>
        </Card>

        {/* Asset Value Over Time Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-intranet-primary">
              <LineChart size={18} className="mr-2" />
              Asset Value Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 border border-gray-200 rounded-md h-52 flex items-center justify-center text-muted-foreground">
              Line Chart Placeholder
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Maintenance Card */}
      <Card className="col-span-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-intranet-primary">
            <ListChecks size={18} className="mr-2" />
            Upcoming Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 border border-gray-200 rounded-md h-40 flex items-center justify-center text-muted-foreground">
            List/Timeline Placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
