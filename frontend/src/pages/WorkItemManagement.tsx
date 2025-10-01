import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Upload,
  FileText,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Timer,
  TrendingUp,
  Filter,
  Search,
  Eye,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface WorkItem {
  _id: string;
  case: {
    _id: string;
    title: string;
    caseNumber: string;
    status: string;
  };
  title: string;
  description: string;
  workType: string;
  status: string;
  priority: string;
  estimatedHours: number;
  actualHours: number;
  billingRate: number;
  estimatedAmount: number;
  actualAmount: number;
  deliverables: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  client: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  lawyer: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  dueDate: string;
  createdAt: string;
  workflow: {
    created?: { date: string; by: string; notes: string };
    in_progress?: { date: string; by: string; notes: string };
    completed?: { date: string; by: string; notes: string };
    approved?: { date: string; by: string; notes: string };
  };
  communications: Array<{
    _id: string;
    sender: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    senderRole: string;
    message: string;
    messageType: string;
    timestamp: string;
    attachments: Array<{
      name: string;
      url: string;
    }>;
  }>;
  autoApproval: {
    enabled: boolean;
    daysToAutoApprove: number;
    eligibleDate?: string;
  };
}

const WorkItemManagement: React.FC = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWorkType, setFilterWorkType] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    caseId: '',
    title: '',
    description: '',
    workType: '',
    priority: 'medium',
    estimatedHours: '',
    billingRate: '',
    dueDate: ''
  });

  // Communication form
  const [communicationData, setCommunicationData] = useState({
    message: '',
    messageType: 'general'
  });

  const workTypes = [
    { value: 'research', label: 'Legal Research' },
    { value: 'drafting', label: 'Document Drafting' },
    { value: 'consultation', label: 'Client Consultation' },
    { value: 'court_appearance', label: 'Court Appearance' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'review', label: 'Document Review' },
    { value: 'filing', label: 'Court Filing' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const statusColors = {
    'pending': 'bg-gray-100 text-gray-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'in_review': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-purple-100 text-purple-800',
    'paid': 'bg-emerald-100 text-emerald-800',
    'revision_required': 'bg-orange-100 text-orange-800',
    'on_hold': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchWorkItems();
    // Get current user role from auth context or localStorage
    setCurrentUserRole(localStorage.getItem('userRole') || 'client');
  }, []);

  const fetchWorkItems = async () => {
    try {
      const response = await api.get('/work-items');
      setWorkItems(response.data.data);
    } catch (error) {
      console.error('Error fetching work items:', error);
      toast.error('Failed to fetch work items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        caseId: formData.caseId,
        title: formData.title,
        description: formData.description,
        workType: formData.workType,
        priority: formData.priority,
        estimatedHours: parseFloat(formData.estimatedHours) || 0,
        billingRate: parseFloat(formData.billingRate) || 0,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined
      };

      await api.post('/work-items', payload);
      toast.success('Work item created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchWorkItems();
    } catch (error: any) {
      console.error('Error creating work item:', error);
      toast.error(error.response?.data?.message || 'Failed to create work item');
    }
  };

  const handleStatusUpdate = async (workItemId: string, status: string, notes?: string) => {
    try {
      const payload = {
        status,
        notes: notes || ''
      };

      await api.patch(`/work-items/${workItemId}/status`, payload);
      toast.success(`Work item status updated to ${status.replace('_', ' ')}`);
      
      // If details dialog is open, refresh the selected item
      if (selectedItem?._id === workItemId) {
        const updatedItem = workItems.find(item => item._id === workItemId);
        if (updatedItem) {
          setSelectedItem({ ...updatedItem, status });
        }
      }
      
      fetchWorkItems();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddCommunication = async (workItemId: string) => {
    if (!communicationData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await api.post(`/work-items/${workItemId}/communication`, communicationData);
      toast.success('Message sent successfully');
      setCommunicationData({ message: '', messageType: 'general' });
      
      // Refresh work items to get updated communications
      fetchWorkItems();
      
      // If details dialog is open, we should refresh the selected item
      if (selectedItem?._id === workItemId) {
        const updatedItem = workItems.find(item => item._id === workItemId);
        if (updatedItem) {
          setSelectedItem(updatedItem);
        }
      }
    } catch (error: any) {
      console.error('Error adding communication:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const resetForm = () => {
    setFormData({
      caseId: '',
      title: '',
      description: '',
      workType: '',
      priority: 'medium',
      estimatedHours: '',
      billingRate: '',
      dueDate: ''
    });
  };

  const getStatusActions = (item: WorkItem) => {
    const { status } = item;
    const isLawyer = currentUserRole === 'lawyer';
    const isClient = currentUserRole === 'client';

    const actions = [];

    if (isLawyer) {
      if (status === 'pending') {
        actions.push({ label: 'Start Work', value: 'in_progress', icon: Play });
      }
      if (status === 'in_progress') {
        actions.push(
          { label: 'Complete', value: 'completed', icon: CheckCircle },
          { label: 'Put on Hold', value: 'on_hold', icon: Pause }
        );
      }
      if (status === 'revision_required') {
        actions.push({ label: 'Resume', value: 'in_progress', icon: Play });
      }
      if (status === 'on_hold') {
        actions.push({ label: 'Resume', value: 'in_progress', icon: Play });
      }
    }

    if (isClient) {
      if (status === 'completed') {
        actions.push(
          { label: 'Approve', value: 'approved', icon: CheckCircle },
          { label: 'Request Revision', value: 'revision_required', icon: AlertCircle }
        );
      }
    }

    if (status !== 'cancelled' && status !== 'paid') {
      actions.push({ label: 'Cancel', value: 'cancelled', icon: Square });
    }

    return actions;
  };

  const filteredWorkItems = workItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.case.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesWorkType = filterWorkType === 'all' || item.workType === filterWorkType;
    
    return matchesSearch && matchesStatus && matchesWorkType;
  });

  const getProgressPercentage = (status: string) => {
    const statusOrder = {
      'pending': 10,
      'in_progress': 40,
      'completed': 70,
      'in_review': 80,
      'approved': 90,
      'paid': 100,
      'revision_required': 50,
      'on_hold': 30,
      'cancelled': 0
    };
    return statusOrder[status as keyof typeof statusOrder] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Work Items</h1>
          <p className="text-gray-600">Track and manage your legal work items</p>
        </div>
        {currentUserRole === 'lawyer' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Work Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Work Item</DialogTitle>
                <DialogDescription>
                  Create a new work item to track your legal work
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateWorkItem} className="space-y-6">
                <div>
                  <Label htmlFor="caseId">Case *</Label>
                  <Input
                    id="caseId"
                    placeholder="Enter case ID"
                    value={formData.caseId}
                    onChange={(e) => setFormData({...formData, caseId: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="title">Work Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief title for this work"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the work to be done"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workType">Work Type *</Label>
                    <Select value={formData.workType} onValueChange={(value) => setFormData({...formData, workType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="billingRate">Billing Rate (₹/hour)</Label>
                    <Input
                      id="billingRate"
                      type="number"
                      placeholder="0"
                      value={formData.billingRate}
                      onChange={(e) => setFormData({...formData, billingRate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Work Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Work Items</p>
                <p className="text-2xl font-bold">{workItems.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {workItems.filter(item => item.status === 'in_progress').length}
                </p>
              </div>
              <Timer className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {workItems.filter(item => ['completed', 'approved', 'paid'].includes(item.status)).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  ₹{workItems.reduce((sum, item) => sum + (item.actualAmount || item.estimatedAmount), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search work items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterWorkType} onValueChange={setFilterWorkType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Work Types</SelectItem>
                {workTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Items List */}
      <div className="space-y-4">
        {filteredWorkItems.map((item) => (
          <Card key={item._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={priorities.find(p => p.value === item.priority)?.color}>
                      {item.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {item.case.title}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {currentUserRole === 'lawyer' ? item.client.name : item.lawyer.name}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {item.estimatedHours}h estimated
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ₹{(item.actualAmount || item.estimatedAmount).toLocaleString()}
                    </div>
                    {item.dueDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due {format(new Date(item.dueDate), 'MMM dd')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusActions(item).map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <Button
                        key={action.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(item._id, action.value)}
                      >
                        <IconComponent className="h-4 w-4 mr-1" />
                        {action.label}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{getProgressPercentage(item.status)}%</span>
                </div>
                <Progress value={getProgressPercentage(item.status)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkItems.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Work Items Found</h3>
            <p className="text-sm">
              {searchTerm || filterStatus !== 'all' || filterWorkType !== 'all'
                ? "No work items match your current filters."
                : "Create your first work item to get started."
              }
            </p>
          </div>
        </Card>
      )}

      {/* Work Item Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  {selectedItem.case.title} • Created {formatDistanceToNow(new Date(selectedItem.createdAt))} ago
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Status and Progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={statusColors[selectedItem.status as keyof typeof statusColors]}>
                        {selectedItem.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={priorities.find(p => p.value === selectedItem.priority)?.color}>
                        {selectedItem.priority} priority
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-600">
                      {getProgressPercentage(selectedItem.status)}% complete
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(selectedItem.status)} className="h-3" />
                </div>

                {/* Work Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Work Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Work Type:</span>
                        <span>{workTypes.find(t => t.value === selectedItem.workType)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Hours:</span>
                        <span>{selectedItem.estimatedHours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actual Hours:</span>
                        <span>{selectedItem.actualHours || 0}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Billing Rate:</span>
                        <span>₹{selectedItem.billingRate.toLocaleString()}/hour</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Financial Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Estimated Amount:</span>
                        <span>₹{selectedItem.estimatedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actual Amount:</span>
                        <span>₹{(selectedItem.actualAmount || 0).toLocaleString()}</span>
                      </div>
                      {selectedItem.dueDate && (
                        <div className="flex justify-between">
                          <span>Due Date:</span>
                          <span>{format(new Date(selectedItem.dueDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedItem.description}</p>
                </div>

                {/* Communications */}
                <div>
                  <h4 className="font-medium mb-4">Communications</h4>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {selectedItem.communications.map((comm) => (
                      <div key={comm._id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{comm.sender.name}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {comm.senderRole}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comm.timestamp))} ago
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{comm.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Communication */}
                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder="Add a message..."
                      value={communicationData.message}
                      onChange={(e) => setCommunicationData({...communicationData, message: e.target.value})}
                      rows={2}
                    />
                    <div className="flex justify-between items-center">
                      <Select 
                        value={communicationData.messageType} 
                        onValueChange={(value) => setCommunicationData({...communicationData, messageType: value})}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="approval_request">Approval Request</SelectItem>
                          <SelectItem value="revision_request">Revision Request</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddCommunication(selectedItem._id)}
                        disabled={!communicationData.message.trim()}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkItemManagement;