import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Calendar, 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { toast } from 'sonner';

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  lawyer?: {
    _id: string;
    name: string;
    email: string;
  };
  nextHearing?: {
    date: string;
    venue: string;
  };
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
  documents?: any[];
}

const CaseManagementSection: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data } = await api.get('/cases');
      setCases(data.cases || []);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Case['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Briefcase, label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resolved' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelled' }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Case['priority']) => {
    const priorityConfig = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={priorityConfig[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const filterCases = (status?: string) => {
    if (!status || status === 'all') return cases;
    if (status === 'active') return cases.filter(c => ['pending', 'in_progress'].includes(c.status));
    if (status === 'completed') return cases.filter(c => ['resolved', 'completed'].includes(c.status));
    return cases.filter(c => c.status === status);
  };

  const CaseCard = ({ case: caseItem }: { case: Case }) => (
    <Card key={caseItem._id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{caseItem.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Case #{caseItem.caseNumber}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(caseItem.status)}
            {getPriorityBadge(caseItem.priority)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {caseItem.description}
        </p>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{caseItem.progress || 0}%</span>
          </div>
          <Progress value={caseItem.progress || 0} className="h-2" />
        </div>
        
        {/* Case Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Lawyer:</span>
            <span className="font-medium">{caseItem.lawyer?.name || 'Not assigned'}</span>
          </div>
          
          {caseItem.nextHearing && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Next hearing:</span>
              <span className="font-medium">
                {new Date(caseItem.nextHearing.date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Created {new Date(caseItem.createdAt).toLocaleDateString()}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/case/${caseItem._id}/view`)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Case Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-navy"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Case Management
        </CardTitle>
        <CardDescription>
          Track all your legal cases and their progress
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Cases ({cases.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({filterCases('active').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterCases('completed').length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filterCases('pending').length})
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4">
            {['all', 'active', 'completed', 'pending'].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-4">
                <div className="grid gap-4">
                  {filterCases(tabValue === 'all' ? undefined : tabValue).length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No cases found</h3>
                      <p className="text-muted-foreground">
                        {tabValue === 'all' 
                          ? "You don't have any cases yet."
                          : `No ${tabValue} cases at the moment.`
                        }
                      </p>
                    </div>
                  ) : (
                    filterCases(tabValue === 'all' ? undefined : tabValue).map((caseItem) => (
                      <CaseCard key={caseItem._id} case={caseItem} />
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CaseManagementSection;