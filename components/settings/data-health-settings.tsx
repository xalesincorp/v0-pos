"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Save,
  Database,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Trash2
} from "lucide-react";
import { DataHealthService } from "@/lib/services/dataHealthService";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useAuthStore } from "@/lib/stores/authStore";

interface DataHealthSettingsProps {
  onArchiveComplete?: () => void;
  onOptimizeComplete?: () => void;
}

export default function DataHealthSettings({ onArchiveComplete, onOptimizeComplete }: DataHealthSettingsProps) {
  const { getSetting, updateSetting, isLoading } = useSettingsStore();
  const { user } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);
  const [settings, setSettings] = useState({
    autoArchiveEnabled: false,
    autoArchiveDays: 365,
    autoOptimizeEnabled: false,
    autoOptimizeInterval: 30, // days
  });
  
  const [healthReport, setHealthReport] = useState<Awaited<ReturnType<typeof DataHealthService.getDataHealthReport>> | null>(null);
  const [archiveStats, setArchiveStats] = useState<Awaited<ReturnType<typeof DataHealthService.getArchiveStatistics>> | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial settings and data health report
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load settings
        const dataHealthSettings = getSetting('dataHealth');
        if (dataHealthSettings) {
          setSettings(dataHealthSettings);
        }
        
        // Load health report
        const report = await DataHealthService.getDataHealthReport();
        setHealthReport(report);
        
        // Load archive statistics
        const stats = await DataHealthService.getArchiveStatistics();
        setArchiveStats(stats);
      } catch (error) {
        console.error("Error loading data health data:", error);
        setError("Failed to load data health information");
      }
    };

    loadData();
  }, [getSetting]);

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLocalLoading(true);
    
    try {
      await updateSetting('dataHealth', settings, user.id);
      
      // Wait minimum 1 second after successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess("Data health settings saved successfully");
      setError(null);
    } catch (error) {
      console.error("Error saving data health settings:", error);
      
      setError("Failed to save data health settings");
      setSuccess(null);
    } finally {
      // Wait minimum 1 second total and then clear loading state
      setTimeout(() => {
        setLocalLoading(false);
      }, 1000);
    }
  };

  const handleArchiveOldData = async () => {
    if (!user) return;
    
    setIsArchiving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await DataHealthService.archiveOldData({
        olderThanDays: settings.autoArchiveDays
      });
      
      setSuccess(`Successfully archived ${result.archivedCount} records`);
      
      // Refresh health report and archive stats
      const report = await DataHealthService.getDataHealthReport();
      setHealthReport(report);
      
      const stats = await DataHealthService.getArchiveStatistics();
      setArchiveStats(stats);
      
      // Notify parent component if callback provided
      if (onArchiveComplete) {
        onArchiveComplete();
      }
    } catch (error) {
      console.error("Error archiving old data:", error);
      setError("Failed to archive old data");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    if (!user) return;
    
    setIsOptimizing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await DataHealthService.optimizeDatabase({
        reclaimSpace: true,
        rebuildIndexes: true,
        cleanUpOrphans: true,
      });
      
      setSuccess(`Database optimized successfully. Reclaimed ${result.reclaimedSpace} bytes of space`);
      
      // Refresh health report
      const report = await DataHealthService.getDataHealthReport();
      setHealthReport(report);
      
      // Notify parent component if callback provided
      if (onOptimizeComplete) {
        onOptimizeComplete();
      }
    } catch (error) {
      console.error("Error optimizing database:", error);
      setError("Failed to optimize database");
    } finally {
      setIsOptimizing(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'needs_attention':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-foreground';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'needs_attention':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Status */}
      {healthReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Total Records</div>
                <div className="text-2xl font-bold">{healthReport.totalRecords.toLocaleString('id-ID')}</div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Archived Records</div>
                <div className="text-2xl font-bold">{healthReport.archivedRecords.toLocaleString('id-ID')}</div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Health Status</div>
                <div className="flex items-center gap-2">
                  {getHealthStatusIcon(healthReport.optimizationStatus)}
                  <span className={`font-medium ${getHealthStatusColor(healthReport.optimizationStatus)}`}>
                    {healthReport.optimizationStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Last Optimized</div>
                <div className="font-medium">
                  {healthReport.lastOptimized 
                    ? new Date(healthReport.lastOptimized).toLocaleDateString('id-ID') 
                    : 'Never'}
                </div>
              </div>
            </div>
            
            {healthReport.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800">Recommendations</h4>
                <ul className="mt-2 space-y-1">
                  {healthReport.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-yellow-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Archive Statistics */}
      {archiveStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archive Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Total Archived</div>
                <div className="text-2xl font-bold">{archiveStats.totalArchived.toLocaleString('id-ID')}</div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Oldest Record</div>
                <div className="font-medium">
                  {archiveStats.oldestArchivedRecord 
                    ? new Date(archiveStats.oldestArchivedRecord).toLocaleDateString('id-ID') 
                    : 'N/A'}
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Transactions</div>
                <div className="text-2xl font-bold">{archiveStats.archivedByType.transactions.toLocaleString('id-ID')}</div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Products</div>
                <div className="text-2xl font-bold">{archiveStats.archivedByType.products.toLocaleString('id-ID')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Data Health Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Auto Archive */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Automatic Archiving</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Enable Automatic Archiving
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Automatically archive data older than specified days
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoArchiveEnabled}
                  onChange={(e) => handleChange("autoArchiveEnabled", e.target.checked)}
                  className="h-4 w-4 rounded border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
              </div>
              
              {settings.autoArchiveEnabled && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Archive Data Older Than (Days)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="3650"
                    value={settings.autoArchiveDays}
                    onChange={(e) => handleChange("autoArchiveDays", Number(e.target.value))}
                    className="w-full sm:w-32"
                  />
                </div>
              )}
            </div>
            
            {/* Auto Optimize */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Automatic Optimization</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Enable Automatic Optimization
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically optimize database at regular intervals
                  </p>
                </div>
                <Switch
                  checked={settings.autoOptimizeEnabled}
                  onCheckedChange={(checked) => handleChange("autoOptimizeEnabled", checked)}
                />
              </div>
              
              {settings.autoOptimizeEnabled && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Optimization Interval (Days)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.autoOptimizeInterval}
                    onChange={(e) => handleChange("autoOptimizeInterval", Number(e.target.value))}
                    className="w-full sm:w-32"
                  />
                </div>
              )}
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90" disabled={localLoading}>
                <Save className="w-4 h-4" />
                {localLoading ? 'Menyimpan...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Manual Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Manual Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Archive Old Data */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Archive Old Data</h3>
              <p className="text-sm text-muted-foreground">
                Archive data older than {settings.autoArchiveDays} days to improve performance
              </p>
              <Button 
                onClick={handleArchiveOldData} 
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={isArchiving || !user}
              >
                <Archive className="w-4 h-4" />
                {isArchiving ? 'Archiving...' : 'Archive Old Data'}
              </Button>
            </div>
            
            {/* Optimize Database */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Optimize Database</h3>
              <p className="text-sm text-muted-foreground">
                Optimize database by cleaning up unused space and rebuilding indexes
              </p>
              <Button 
                onClick={handleOptimizeDatabase} 
                className="gap-2 bg-green-600 hover:bg-green-700"
                disabled={isOptimizing || !user}
              >
                <RefreshCw className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
                {isOptimizing ? 'Optimizing...' : 'Optimize Database'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}