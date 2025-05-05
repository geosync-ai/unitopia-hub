
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Bell, LayoutList, ChevronRight, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Placeholder data for the dashboard metrics
const dashboardData = {
  totalValue: 15700,
  totalValueChange: 12.1,
  totalValueDiff: 1700,
  acquisitions: 8500,
  acquisitionsChange: 6.3,
  acquisitionsDiff: 500,
  depreciation: 6222,
  depreciationChange: -2.4,
  depreciationDiff: 1222,
  assetCount: 50,
  categoryCount: 15,
  acquisitionTransactions: 27,
  acquisitionCategories: 6,
  depreciationTransactions: 23,
  depreciationCategories: 9
};

export function AssetDashboard() {
  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Asset Value Card */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total asset value</CardTitle>
            <div className="rounded-md bg-primary-50 px-2 py-1 text-xs">USD</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(dashboardData.totalValue)} 
              <span className="text-muted-foreground text-sm font-normal">.00</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <ChevronUp className="mr-1 h-4 w-4" />
                {dashboardData.totalValueChange}%
              </div>
              <div className="text-sm text-muted-foreground">
                You have extra {formatCurrency(dashboardData.totalValueDiff)} compared to last month
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <LayoutList className="mr-1 h-4 w-4" />
                {dashboardData.assetCount} assets
              </div>
              <div className="flex items-center text-muted-foreground">
                <Bell className="mr-1 h-4 w-4" />
                {dashboardData.categoryCount} categories
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Acquisitions Card */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New acquisitions</CardTitle>
            <div className="rounded-md bg-primary-50 px-2 py-1 text-xs">USD</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(dashboardData.acquisitions)} 
              <span className="text-muted-foreground text-sm font-normal">.00</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <ChevronUp className="mr-1 h-4 w-4" />
                {dashboardData.acquisitionsChange}%
              </div>
              <div className="text-sm text-muted-foreground">
                You earn extra {formatCurrency(dashboardData.acquisitionsDiff)} compared to last month
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <LayoutList className="mr-1 h-4 w-4" />
                {dashboardData.acquisitionTransactions} transactions
              </div>
              <div className="flex items-center text-muted-foreground">
                <Bell className="mr-1 h-4 w-4" />
                {dashboardData.acquisitionCategories} categories
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Depreciation Card */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Depreciation</CardTitle>
            <div className="rounded-md bg-primary-50 px-2 py-1 text-xs">USD</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(dashboardData.depreciation)} 
              <span className="text-muted-foreground text-sm font-normal">.00</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm font-medium text-red-600">
                <ArrowDownRight className="mr-1 h-4 w-4" />
                {Math.abs(dashboardData.depreciationChange)}%
              </div>
              <div className="text-sm text-muted-foreground">
                You spent extra {formatCurrency(dashboardData.depreciationDiff)} compared to last month
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <LayoutList className="mr-1 h-4 w-4" />
                {dashboardData.depreciationTransactions} transactions
              </div>
              <div className="flex items-center text-muted-foreground">
                <Bell className="mr-1 h-4 w-4" />
                {dashboardData.depreciationCategories} categories
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asset Value Overview Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Total asset value overview</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-primary"></div>
                <span className="text-xs">This month</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                <span className="text-xs">Same period last month</span>
              </div>
              <div className="rounded-md border px-2 py-1 text-xs font-medium flex items-center">
                Total value <ChevronRight className="ml-1 h-3 w-3" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <div className="flex h-full w-full items-center justify-center bg-muted/20 rounded-md">
                <p className="text-sm text-muted-foreground">Asset Value Chart Placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Statistics</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="rounded-md border px-2 py-1 text-xs font-medium flex items-center">
                Depreciation <ChevronRight className="ml-1 h-3 w-3" />
              </div>
              <div className="rounded-md border px-2 py-1 text-xs font-medium flex items-center">
                Details <ChevronRight className="ml-1 h-3 w-3" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-sm text-muted-foreground">
              You have an increase of depreciation in several categories this month
            </div>
            <div className="h-[200px] w-full">
              <div className="flex h-full w-full items-center justify-center bg-muted/20 rounded-md">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Depreciation Donut Chart Placeholder</p>
                  <p className="text-xl font-bold mt-2">{formatCurrency(dashboardData.depreciation)}<span className="text-muted-foreground text-sm font-normal">.00</span></p>
                  <p className="text-sm text-muted-foreground">This month depreciation</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-primary"></div>
                <span className="text-xs">IT Equipment</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <span className="text-xs">Office Equipment</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-gray-600"></div>
                <span className="text-xs">Vehicles</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                <span className="text-xs">Others</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Charts Row */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Comparing of budget and acquisition</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded-full bg-primary"></div>
              <span className="text-xs">Acquisition</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-xs">Budget</span>
            </div>
            <div className="rounded-md border px-2 py-1 text-xs font-medium flex items-center">
              This year <ChevronRight className="ml-1 h-3 w-3" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <div className="flex h-full w-full items-center justify-center bg-muted/20 rounded-md">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Budget vs Acquisition Bar Chart Placeholder</p>
                <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium mt-2">
                  Exceeded by 20% {formatCurrency(500)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Maintenance */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-medium">Upcoming Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-start space-x-4 border-b pb-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">L</div>
              <div className="flex-1">
                <p className="text-sm font-medium">Laptop MacBook Pro 16" - Annual maintenance</p>
                <p className="text-xs text-muted-foreground">Due in 5 days - Assigned to IT Support</p>
              </div>
              <div className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
                Upcoming
              </div>
            </div>
            <div className="flex items-start space-x-4 border-b pb-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">S</div>
              <div className="flex-1">
                <p className="text-sm font-medium">Server Rack 01 - Quarterly check</p>
                <p className="text-xs text-muted-foreground">Due tomorrow - Assigned to Network Team</p>
              </div>
              <div className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-md">
                Urgent
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">P</div>
              <div className="flex-1">
                <p className="text-sm font-medium">Projector P03 - Lamp replacement</p>
                <p className="text-xs text-muted-foreground">Due in 2 weeks - Assigned to Office Manager</p>
              </div>
              <div className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                Scheduled
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
