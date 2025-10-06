import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Eye, 
  RefreshCw, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  isVerified?: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const VerificationManagementAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, searchTerm]);

  const fetchUsers = async (page = pagination.page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await api.get(`/admin/verifications/pending?${params}`);
      setUsers(response.data.verifications);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (userId: string) => {
    navigate(`/admin/verification/${userId}`);
  };

  const handleViewDetails = (userId: string) => {
    navigate(`/admin/users/${userId}/details`);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setActiveTab(role);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filteredUsersByTab = (role: string) => {
    if (role === 'all') return users;
    return users.filter(user => user.role === role);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Verification Management</h2>
          <p className="text-gray-600">Review and approve user verification requests</p>
        </div>
        <Button onClick={() => fetchUsers()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, phone, or user ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="lawyer">Lawyers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="all" 
            onClick={() => handleRoleFilter('all')}
          >
            All Pending ({users.length})
          </TabsTrigger>
          <TabsTrigger 
            value="client" 
            onClick={() => handleRoleFilter('client')}
          >
            Clients ({users.filter(u => u.role === 'client').length})
          </TabsTrigger>
          <TabsTrigger 
            value="lawyer" 
            onClick={() => handleRoleFilter('lawyer')}
          >
            Lawyers ({users.filter(u => u.role === 'lawyer').length})
          </TabsTrigger>
        </TabsList>

        {['all', 'client', 'lawyer'].map(role => (
          <TabsContent key={role} value={role}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {role === 'all' ? 'All Users' : 
                   role === 'client' ? 'Clients' : 
                   role === 'lawyer' ? 'Lawyers' : 'Admins'}
                </CardTitle>
                <CardDescription>
                  {role === 'all' ? 'Manage all platform users' :
                   role === 'client' ? 'Manage client accounts and their case history' :
                   role === 'lawyer' ? 'Manage lawyer accounts and verification status' :
                   'Manage administrative accounts'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredUsersByTab(role).length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-gray-600">
                      No pending {role === 'all' ? '' : role + ' '}verification requests at the moment.
                    </p>
                  </div>
                ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsersByTab(role).map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-gray-500 font-mono">
                                  ID: {user._id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium">{user.email}</div>
                              <div className="text-sm text-gray-500">
                                {user.phone || 'No phone'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                user.role === 'admin' ? 'destructive' :
                                user.role === 'lawyer' ? 'default' : 'secondary'
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewRequest(user._id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Request
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Showing {users.length} of {pagination.total} verifications
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchUsers(pagination.page - 1)}
                      disabled={!pagination.hasPrev || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchUsers(pagination.page + 1)}
                      disabled={!pagination.hasNext || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default VerificationManagementAdmin;