
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetsTable } from "@/components/assets/AssetsTable";
import { fetcher } from "@/lib/api";
import { Asset } from "@/types/asset";
import { Plus, RotateCcw } from "lucide-react";
import { useDivisionContext } from "@/hooks/useDivisionContext";
import { AddAssetDialog } from "@/components/assets/AddAssetDialog";
import { useToast } from "@/hooks/use-toast";

export function AssetsPage() {
  const { currentDivisionId } = useDivisionContext();
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  // Fetch assets
  const { data: assets = [], refetch, isLoading } = useQuery({
    queryKey: ["assets", currentDivisionId],
    queryFn: async () => {
      try {
        const response = await fetcher(`/api/assets?division=${currentDivisionId || ''}`);
        return response.data || [];
      } catch (error) {
        console.error("Error fetching assets:", error);
        toast({
          title: "Error",
          description: "Failed to load assets. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Get unique values for filters
  const types = [...new Set(assets.map((asset: Asset) => asset.type))];
  const conditions = [...new Set(assets.map((asset: Asset) => asset.condition))];
  const units = [...new Set(assets.map((asset: Asset) => asset.unit))];
  const divisions = [...new Set(assets.map((asset: Asset) => asset.division))];
  const vendors = [...new Set(assets.map((asset: Asset) => asset.vendor).filter(Boolean))];

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Apply filters and sorting
  const filteredAssets = assets
    .filter((asset: Asset) => {
      const searchMatch =
        filter === "" ||
        Object.values(asset).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(filter.toLowerCase())
        );
      
      const typeMatch = typeFilter === "all" || asset.type === typeFilter;
      const conditionMatch = conditionFilter === "all" || asset.condition === conditionFilter;
      const unitMatch = unitFilter === "all" || asset.unit === unitFilter;
      const divisionMatch = divisionFilter === "all" || asset.division === divisionFilter;
      const vendorMatch = vendorFilter === "all" || asset.vendor === vendorFilter;
      
      return searchMatch && typeMatch && conditionMatch && unitMatch && divisionMatch && vendorMatch;
    })
    .sort((a: Asset, b: Asset) => {
      const aValue = a[sortColumn as keyof Asset];
      const bValue = b[sortColumn as keyof Asset];
      
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Reset filters
  const resetFilters = () => {
    setFilter("");
    setTypeFilter("all");
    setConditionFilter("all");
    setUnitFilter("all");
    setDivisionFilter("all");
    setVendorFilter("all");
  };

  // Handle asset addition
  const handleAssetAdded = () => {
    refetch();
    setIsAddAssetOpen(false);
    toast({
      title: "Asset Added",
      description: "The asset has been added successfully.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Button 
          onClick={() => setIsAddAssetOpen(true)}
          className="bg-red-800 hover:bg-red-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </div>

      <div className="flex flex-col space-y-4">
        <Input
          placeholder="Filter by name, type, vendor..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
        
        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {conditions.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map((division) => (
                <SelectItem key={division} value={division}>
                  {division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {/* Add a container with appropriate height and overflow settings */}
      <div className="border rounded-md">
        <AssetsTable
          assets={filteredAssets}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          divisionId={currentDivisionId}
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        Showing {filteredAssets.length} of {assets.length} assets
      </div>

      {/* Add Asset Dialog */}
      <AddAssetDialog
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAssetAdded={handleAssetAdded}
        divisionId={currentDivisionId}
      />
    </div>
  );
}
