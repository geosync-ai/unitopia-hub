
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronUp, ChevronDown, Eye, Edit, Trash2 } from "lucide-react";
import { Asset } from "@/types/asset";
import { formatDate } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

interface AssetsTableProps {
  assets: Asset[];
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  divisionId?: string;
  onView?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
}

export function AssetsTable({ 
  assets, 
  onSort, 
  sortColumn, 
  sortDirection,
  divisionId,
  onView,
  onEdit,
  onDelete
}: AssetsTableProps) {
  // Function to render sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return null;
  };

  // Function to handle column click for sorting
  const handleColumnClick = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  return (
    <div className="rounded-md border">
      <div className="responsive-table-container">
        {/* Ensure the container has a fixed height and overflow settings */}
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
          <Table>
            {/* Apply sticky styling to table header */}
            <TableHeader className="sticky top-0 z-10 bg-white border-b">
              <TableRow>
                <TableCell className="w-12 p-2 text-center"></TableCell>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('name')}
                >
                  <TooltipWrapper content="Click to sort by name">
                    <div className="flex items-center">
                      Name {renderSortIndicator('name')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('id')}
                >
                  <TooltipWrapper content="Click to sort by ID">
                    <div className="flex items-center">
                      ID {renderSortIndicator('id')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('type')}
                >
                  <TooltipWrapper content="Click to sort by asset type">
                    <div className="flex items-center">
                      Type {renderSortIndicator('type')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('condition')}
                >
                  <TooltipWrapper content="Click to sort by asset condition">
                    <div className="flex items-center">
                      Condition {renderSortIndicator('condition')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('assignedTo')}
                >
                  <TooltipWrapper content="Click to sort by person assigned">
                    <div className="flex items-center">
                      Assigned To {renderSortIndicator('assignedTo')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('email')}
                >
                  <TooltipWrapper content="Click to sort by email">
                    <div className="flex items-center">
                      Email {renderSortIndicator('email')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('unit')}
                >
                  <TooltipWrapper content="Click to sort by unit">
                    <div className="flex items-center">
                      Unit {renderSortIndicator('unit')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('division')}
                >
                  <TooltipWrapper content="Click to sort by division">
                    <div className="flex items-center">
                      Division {renderSortIndicator('division')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('description')}
                >
                  <TooltipWrapper content="Click to sort by description">
                    <div className="flex items-center">
                      Description {renderSortIndicator('description')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('assignedDate')}
                >
                  <TooltipWrapper content="Click to sort by assigned date">
                    <div className="flex items-center">
                      Assigned Date {renderSortIndicator('assignedDate')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('purchasedDate')}
                >
                  <TooltipWrapper content="Click to sort by purchase date">
                    <div className="flex items-center">
                      Purchased Date {renderSortIndicator('purchasedDate')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer whitespace-nowrap"
                  onClick={() => handleColumnClick('lastUpdated')}
                >
                  <TooltipWrapper content="Click to sort by last updated date">
                    <div className="flex items-center">
                      Last Updated {renderSortIndicator('lastUpdated')}
                    </div>
                  </TooltipWrapper>
                </TableHead>
                <TableHead className="text-right font-medium sticky right-0 bg-white z-20 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-24 text-center">
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="p-2 text-center">
                      <TooltipWrapper content={asset.name || "Asset image"}>
                        {asset.image ? (
                          <img 
                            src={asset.image} 
                            alt={asset.name} 
                            className="w-8 h-8 mx-auto rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 mx-auto rounded-md bg-gray-200 flex items-center justify-center">
                            {asset.name.charAt(0)}
                          </div>
                        )}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={`Asset name: ${asset.name}`}>
                        {asset.name}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={`Asset ID: ${asset.asset_id || asset.id}`}>
                        {asset.asset_id || asset.id}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={`Asset type: ${asset.type}`}>
                        {asset.type}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={`Asset condition: ${asset.condition}`}>
                        {asset.condition}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={`Assigned to: ${asset.assigned_to || asset.assignedTo || 'N/A'}`}>
                        {asset.assigned_to || asset.assignedTo}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={asset.email || 'N/A'}>
                        {asset.email}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={asset.unit || 'N/A'}>
                        {asset.unit}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={asset.division || 'N/A'}>
                        {asset.division}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <TooltipWrapper content={asset.description || 'N/A'}>
                        {asset.description}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={formatDate(asset.assigned_date || asset.assignedDate) || 'N/A'}>
                        {formatDate(asset.assigned_date || asset.assignedDate)}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={formatDate(asset.purchased_date || asset.purchasedDate) || 'N/A'}>
                        {formatDate(asset.purchased_date || asset.purchasedDate)}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TooltipWrapper content={formatDate(asset.last_updated || asset.lastUpdated) || 'N/A'}>
                        {formatDate(asset.last_updated || asset.lastUpdated)}
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="text-right sticky right-0 bg-white z-10">
                      <DropdownMenu>
                        <TooltipWrapper content="Asset actions">
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipWrapper>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(asset)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(asset)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(asset)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
