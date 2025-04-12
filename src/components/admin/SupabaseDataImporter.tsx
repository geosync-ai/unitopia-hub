import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { tasksService, projectsService, risksService, assetsService, krasService } from '@/integrations/supabase/unitService';

interface EntityImport {
  name: string;
  key: string;
  selected: boolean;
  service: any;
  count: number;
}

export default function SupabaseDataImporter() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<Record<string, { success: number; errors: number }>>({});
  const [entities, setEntities] = useState<EntityImport[]>([
    { name: 'Tasks', key: 'unitopia_tasks', selected: true, service: tasksService, count: 0 },
    { name: 'Projects', key: 'unitopia_projects', selected: true, service: projectsService, count: 0 },
    { name: 'Risks', key: 'unitopia_risks', selected: true, service: risksService, count: 0 },
    { name: 'Assets', key: 'unitopia_assets', selected: true, service: assetsService, count: 0 },
    { name: 'KRAs', key: 'unitopia_kras', selected: true, service: krasService, count: 0 },
  ]);

  // Toggle entity selection
  const toggleEntitySelection = (index: number) => {
    setEntities(prev => 
      prev.map((entity, i) => 
        i === index ? { ...entity, selected: !entity.selected } : entity
      )
    );
  };

  // Count items in localStorage
  React.useEffect(() => {
    setEntities(prev => 
      prev.map(entity => {
        const data = localStorage.getItem(entity.key);
        const count = data ? JSON.parse(data).length : 0;
        return { ...entity, count };
      })
    );
  }, []);

  // Import data from localStorage to Supabase
  const importData = async () => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to import data.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResults({});
    
    const selectedEntities = entities.filter(e => e.selected);
    
    // Reset import results
    const results: Record<string, { success: number; errors: number }> = {};
    selectedEntities.forEach(entity => {
      results[entity.key] = { success: 0, errors: 0 };
    });
    
    let processedEntities = 0;
    
    for (const entity of selectedEntities) {
      try {
        // Get data from localStorage
        const dataString = localStorage.getItem(entity.key);
        if (!dataString) {
          processedEntities++;
          setImportProgress(Math.floor((processedEntities / selectedEntities.length) * 100));
          continue;
        }
        
        const data = JSON.parse(dataString);
        if (!Array.isArray(data) || data.length === 0) {
          processedEntities++;
          setImportProgress(Math.floor((processedEntities / selectedEntities.length) * 100));
          continue;
        }
        
        // Import each item to Supabase
        for (const item of data) {
          try {
            // Prepare item for import - ensure it has proper user association
            let preparedItem = { ...item };
            
            // Add proper user email association for each entity type
            switch (entity.key) {
              case 'unitopia_tasks':
                preparedItem.assignee = preparedItem.assignee || user.email;
                break;
              case 'unitopia_projects':
                preparedItem.manager = preparedItem.manager || user.email;
                break;
              case 'unitopia_risks':
                preparedItem.owner = preparedItem.owner || user.email;
                break;
              case 'unitopia_assets':
                preparedItem.assignedTo = preparedItem.assignedTo || user.email;
                break;
              case 'unitopia_kras':
                preparedItem.responsible = preparedItem.responsible || user.email;
                break;
            }
            
            // Remove id field to let Supabase generate a new one
            delete preparedItem.id;
            
            // Import the item
            switch (entity.key) {
              case 'unitopia_tasks':
                await tasksService.addTask(preparedItem);
                break;
              case 'unitopia_projects':
                await projectsService.addProject(preparedItem);
                break;
              case 'unitopia_risks':
                await risksService.addRisk(preparedItem);
                break;
              case 'unitopia_assets':
                await assetsService.addAsset(preparedItem);
                break;
              case 'unitopia_kras':
                await krasService.addKRA(preparedItem);
                break;
            }
            
            results[entity.key].success++;
          } catch (itemError) {
            console.error(`Error importing ${entity.name} item:`, itemError);
            results[entity.key].errors++;
          }
        }
      } catch (entityError) {
        console.error(`Error processing ${entity.name}:`, entityError);
        results[entity.key].errors = results[entity.key].errors || 0;
      }
      
      processedEntities++;
      setImportProgress(Math.floor((processedEntities / selectedEntities.length) * 100));
    }
    
    setImportResults(results);
    setIsImporting(false);
    
    // Calculate total results
    const totalSuccess = Object.values(results).reduce((sum, result) => sum + result.success, 0);
    const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors, 0);
    
    if (totalSuccess > 0 && totalErrors === 0) {
      toast({
        title: "Import Completed",
        description: `Successfully imported ${totalSuccess} items to Supabase.`,
        variant: "default",
      });
    } else if (totalSuccess > 0 && totalErrors > 0) {
      toast({
        title: "Import Completed with Errors",
        description: `Imported ${totalSuccess} items with ${totalErrors} errors.`,
        variant: "destructive",
      });
    } else if (totalSuccess === 0) {
      toast({
        title: "Import Failed",
        description: "No items were imported. Check the console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Data to Supabase</CardTitle>
        <CardDescription>
          Import your existing data from localStorage to Supabase for persistent cloud storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            {entities.map((entity, index) => (
              <div key={entity.key} className="flex items-center space-x-2">
                <Checkbox 
                  id={`entity-${entity.key}`} 
                  checked={entity.selected}
                  onCheckedChange={() => toggleEntitySelection(index)}
                  disabled={isImporting || entity.count === 0}
                />
                <label 
                  htmlFor={`entity-${entity.key}`}
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 ${entity.count === 0 ? 'text-gray-400' : ''}`}
                >
                  {entity.name} ({entity.count} items)
                </label>
              </div>
            ))}
          </div>

          {isImporting && (
            <div className="space-y-2">
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Importing data... {importProgress}% complete
              </p>
            </div>
          )}

          {Object.keys(importResults).length > 0 && (
            <Alert>
              <AlertTitle>Import Results</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {Object.entries(importResults).map(([key, result]) => {
                    const entityName = entities.find(e => e.key === key)?.name || key;
                    return (
                      <li key={key} className="text-sm">
                        {entityName}: {result.success} imported successfully
                        {result.errors > 0 && <span className="text-red-500"> ({result.errors} errors)</span>}
                      </li>
                    );
                  })}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={importData} 
          disabled={isImporting || entities.filter(e => e.selected && e.count > 0).length === 0}
          className="w-full"
        >
          {isImporting ? 'Importing...' : 'Import Selected Data to Supabase'}
        </Button>
      </CardFooter>
    </Card>
  );
} 