
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  DollarSign,
  Timer,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimeEntry {
  _id: string;
  caseId: {
    _id: string;
    title: string;
    caseNumber: string;
  };
  case?: {
    title: string;
  };
  date: string;
  startTime: string;
  endTime?: string;
  duration: number;
  hourlyRate: number;
  amount: number;
  description: string;
  activityType: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  billable: boolean;
  billing: {
    billable: boolean;
    amount: number;
  };
}

interface ActiveTimer {
  _id: string;
  id: string;
  caseId: string;
  description: string;
  activityType: string;
  startTime: string;
  hourlyRate: number;
  isRunning: boolean;
  isPaused: boolean;
  elapsed: number;
}

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
}

interface TimeStats {
  totalHours: number;
  billableHours: number;
  totalAmount: number;
  billableAmount: number;
}

const TimeTracking: React.FC = () => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TimeStats>({
    totalHours: 0,
    billableHours: 0,
    totalAmount: 0,
    billableAmount: 0
  });
  const [filters, setFilters] = useState({
    caseId: '',
    startDate: '',
    endDate: '',
    status: '',
    billable: ''
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const { toast } = useToast();

  // New time entry form
  const [newEntry, setNewEntry] = useState({
    caseId: '',
    description: '',
    activityType: '',
    hourlyRate: 1000,
    duration: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Timer form
  const [timerForm, setTimerForm] = useState({
    caseId: '',
    description: '',
    activityType: 'consultation',
    hourlyRate: 1000
  });

  const activityTypes = [
    { value: 'consultation', label: 'Client Consultation' },
    { value: 'research', label: 'Legal Research' },
    { value: 'document_drafting', label: 'Document Drafting' },
    { value: 'court_appearance', label: 'Court Appearance' },
    { value: 'client_meeting', label: 'Client Meeting' },
    { value: 'case_preparation', label: 'Case Preparation' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'filing', label: 'Filing' },
    { value: 'review', label: 'Review' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'travel', label: 'Travel' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchActiveTimer();
    fetchTimeEntries();
    fetchCases();
  }, [filters]);

  const fetchActiveTimer = async () => {
    try {
      const response = await fetch('/api/billing/time/active', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setActiveTimer(data.activeTimer);
      }
    } catch (error) {
      console.error('Error fetching active timer:', error);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(`/api/billing/time/entries?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setTimeEntries(data.timeEntries);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases/my-cases', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setCases(data.cases);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const startTimer = async () => {
    try {
      const response = await fetch('/api/billing/time/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(timerForm)
      });

      const data = await response.json();
      if (data.success) {
        setActiveTimer({
          _id: data.timeEntry._id || data.timeEntry.id,
          id: data.timeEntry.id,
          caseId: data.timeEntry.caseId,
          startTime: data.timeEntry.startTime,
          description: data.timeEntry.description,
          activityType: data.timeEntry.activityType,
          hourlyRate: data.timeEntry.hourlyRate || 0,
          isRunning: true,
          isPaused: false,
          elapsed: 0
        });
        toast({
          title: "Success",
          description: "Timer started successfully"
        });
        setTimerForm({
          caseId: '',
          description: '',
          activityType: 'consultation',
          hourlyRate: 1000
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive"
      });
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await fetch(`/api/billing/time/${activeTimer.id}/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      if (data.success) {
        setActiveTimer(null);
        fetchTimeEntries();
        toast({
          title: "Success",
          description: `Timer stopped. Duration: ${Math.round(data.timeEntry.duration / 60 * 100) / 100} hours`
        });
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive"
      });
    }
  };

  const addManualEntry = async () => {
    try {
      const response = await fetch('/api/billing/time/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newEntry)
      });

      const data = await response.json();
      if (data.success) {
        setShowAddDialog(false);
        setNewEntry({
          caseId: '',
          description: '',
          activityType: '',
          hourlyRate: 1000,
          duration: 0,
          date: new Date().toISOString().split('T')[0]
        });
        fetchTimeEntries();
        toast({
          title: "Success",
          description: "Time entry added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding manual entry:', error);
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      invoiced: { color: 'bg-purple-100 text-purple-800', label: 'Invoiced' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-1">Track your billable hours and manage time entries</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Manual Time Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Case</label>
                  <Select value={newEntry.caseId} onValueChange={(value) => 
                    setNewEntry(prev => ({ ...prev, caseId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select case" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map(caseItem => (
                        <SelectItem key={caseItem._id} value={caseItem._id}>
                          {caseItem.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={newEntry.duration}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    placeholder="Duration in minutes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Activity Type</label>
                  <Select value={newEntry.activityType} onValueChange={(value) => 
                    setNewEntry(prev => ({ ...prev, activityType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the work performed"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hourly Rate (₹)</label>
                  <Input
                    type="number"
                    value={newEntry.hourlyRate}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={addManualEntry} className="flex-1">
                    Add Entry
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Timer */}
      {activeTimer ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-blue-900">Timer Running</h3>
                  <p className="text-blue-700">{activeTimer.description}</p>
                  <p className="text-sm text-blue-600">
                    Started: {new Date(activeTimer.startTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={stopTimer}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Start Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Case</label>
                <Select value={timerForm.caseId} onValueChange={(value) => 
                  setTimerForm(prev => ({ ...prev, caseId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map(caseItem => (
                      <SelectItem key={caseItem._id} value={caseItem._id}>
                        {caseItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Activity Type</label>
                <Select value={timerForm.activityType} onValueChange={(value) => 
                  setTimerForm(prev => ({ ...prev, activityType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={timerForm.description}
                onChange={(e) => setTimerForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What are you working on?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hourly Rate (₹)</label>
              <Input
                type="number"
                value={timerForm.hourlyRate}
                onChange={(e) => setTimerForm(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) }))}
              />
            </div>
            <Button 
              onClick={startTimer} 
              disabled={!timerForm.caseId || !timerForm.description}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(stats.totalHours || 0)}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Billable Hours</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(stats.billableHours || 0)}h
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Billable Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.billableAmount || 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.caseId} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, caseId: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="All Cases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cases</SelectItem>
                {cases.map(caseItem => (
                  <SelectItem key={caseItem._id} value={caseItem._id}>
                    {caseItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              placeholder="End Date"
            />
            <Select value={filters.status} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.billable} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, billable: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="true">Billable</SelectItem>
                <SelectItem value="false">Non-billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No time entries found
            </div>
          ) : (
            <div className="space-y-4">
              {timeEntries.map(entry => (
                <div key={entry._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{entry.case?.title}</h4>
                        {getStatusBadge(entry.status)}
                        {entry.billing.billable && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Billable
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{entry.description}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(entry.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {activityTypes.find(t => t.value === entry.activityType)?.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(entry.billing.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTracking;
