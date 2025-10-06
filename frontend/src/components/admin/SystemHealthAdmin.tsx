import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Download,
  Zap,
  HardDrive,
  Cpu,
  Users,
  Bell
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface SystemHealth {
  uptime: number;
  nodeVersion?: string;
  platform?: string;
  processId?: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  systemNotifications: Array<{
    _id: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
  }>;
  errorCount: number;
  dbStats: {
    users: number;
    cases: number;
    payments: number;
    notifications: number;
  };
  activeSessions: number;
  timestamp: string;
}

const LoadingSkeleton = ({ count = 3, height = "h-20" }: { count?: number; height?: string }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`animate-pulse bg-gray-200 rounded-lg ${height}`} />
    ))}
  </div>
);

const formatBytes = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const getHealthStatus = (errorCount: number, uptime: number) => {
  if (errorCount === 0 && uptime > 3600) {
    return { status: 'Excellent', color: 'text-green-600 bg-green-100', icon: CheckCircle };
  } else if (errorCount <= 2) {
    return { status: 'Good', color: 'text-blue-600 bg-blue-100', icon: CheckCircle };
  } else if (errorCount <= 5) {
    return { status: 'Warning', color: 'text-yellow-600 bg-yellow-100', icon: AlertTriangle };
  } else {
    return { status: 'Critical', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
  }
};

const SystemHealthAdmin = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSystemHealth();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/admin/system/health');
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      toast.error('Failed to fetch system health');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSkeleton count={4} height="h-64" />;
  if (!systemHealth) return <div>Failed to load system health data</div>;

  const healthStatus = getHealthStatus(systemHealth.errorCount, systemHealth.uptime);
  const memoryUsagePercent = (systemHealth.memoryUsage.heapUsed / systemHealth.memoryUsage.heapTotal) * 100;

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <Badge className={healthStatus.color}>
                  {healthStatus.status}
                </Badge>
              </div>
              <healthStatus.icon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatUptime(systemHealth.uptime)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {systemHealth.activeSessions}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Count (1h)</p>
                <p className="text-2xl font-bold text-red-600">
                  {systemHealth.errorCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Cpu className="h-5 w-5 mr-2" />
                Memory Usage
              </CardTitle>
              <Button 
                onClick={fetchSystemHealth} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Heap Usage</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(systemHealth.memoryUsage.heapUsed)} / {formatBytes(systemHealth.memoryUsage.heapTotal)}
                </span>
              </div>
              <Progress value={memoryUsagePercent} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{memoryUsagePercent.toFixed(1)}% used</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">RSS Memory</p>
                <p className="text-sm font-semibold">{formatBytes(systemHealth.memoryUsage.rss)}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">External</p>
                <p className="text-sm font-semibold">{formatBytes(systemHealth.memoryUsage.external)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-600">{systemHealth.dbStats.users}</p>
                <p className="text-sm text-gray-600">Users</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <HardDrive className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{systemHealth.dbStats.cases}</p>
                <p className="text-sm text-gray-600">Cases</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Zap className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{systemHealth.dbStats.payments}</p>
                <p className="text-sm text-gray-600">Payments</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Bell className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">{systemHealth.dbStats.notifications}</p>
                <p className="text-sm text-gray-600">Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Notifications & Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Notifications & Alerts</CardTitle>
              <CardDescription>Recent system events and notifications</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {systemHealth.systemNotifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemHealth.systemNotifications.map((notification) => (
                  <TableRow key={notification._id}>
                    <TableCell>
                      <Badge 
                        variant={
                          notification.type === 'error' ? 'destructive' :
                          notification.type === 'warning' ? 'secondary' :
                          'default'
                        }
                      >
                        {notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{notification.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-64 truncate text-sm text-gray-600">
                        {notification.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={notification.read ? 'secondary' : 'default'}>
                        {notification.read ? 'Read' : 'Unread'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No system alerts - All systems running normally</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Server Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Node.js Version</span>
                  <span className="font-medium">{systemHealth?.nodeVersion || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform</span>
                  <span className="font-medium">{systemHealth?.platform || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Process ID</span>
                  <span className="font-medium">{systemHealth?.processId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">
                    {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Health Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">System Load</span>
                  <Badge className={healthStatus.color}>
                    {healthStatus.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Rate</span>
                  <span className={`font-medium ${systemHealth.errorCount > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {systemHealth.errorCount > 0 ? `${systemHealth.errorCount} errors/hour` : 'No errors'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-medium">{systemHealth.activeSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memory Efficiency</span>
                  <span className={`font-medium ${memoryUsagePercent > 80 ? 'text-red-600' : 'text-green-600'}`}>
                    {memoryUsagePercent < 50 ? 'Good' : memoryUsagePercent < 80 ? 'Fair' : 'High'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthAdmin;