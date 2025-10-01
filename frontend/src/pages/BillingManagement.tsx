import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, DollarSign, FileText, Upload, AlertTriangle, CheckCircle, Timer } from 'lucide-react';

interface Payment {
  _id: string;
  caseId: {
    _id: string;
    title: string;
    caseNumber: string;
  };
  clientId: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'pending' | 'received' | 'work_submitted' | 'approved' | 'released' | 'disputed';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  escrowHoldingPeriod: number;
  workSubmittedAt?: Date;
  workDescription?: string;
  workDocuments?: string[];
  disputeReason?: string;
  disputeRaisedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeEntry {
  _id: string;
  caseId: {
    _id: string;
    title: string;
    caseNumber: string;
  };
  date: Date;
  startTime: Date;
  endTime?: Date;
  duration: number;
  hourlyRate: number;
  amount: number;
  description: string;
  activityType: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  billable: boolean;
}

interface BillingStats {
  totalEarnings: number;
  pendingPayments: number;
  completedPayments: number;
  disputedPayments: number;
  unbilledHours: number;
  averageHourlyRate: number;
}

const BillingManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [workSubmissionDialog, setWorkSubmissionDialog] = useState<{ open: boolean; payment?: Payment }>({ open: false });
  const [disputeDialog, setDisputeDialog] = useState<{ open: boolean; payment?: Payment }>({ open: false });
  const [workDescription, setWorkDescription] = useState('');
  const [workDocuments, setWorkDocuments] = useState<File[]>([]);
  const [disputeReason, setDisputeReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [paymentsRes, timeEntriesRes, statsRes] = await Promise.all([
        fetch('/api/billing/payments', { headers }),
        fetch('/api/time-tracking/entries', { headers }),
        fetch('/api/billing/stats', { headers })
      ]);

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      if (timeEntriesRes.ok) {
        const timeEntriesData = await timeEntriesRes.json();
        setTimeEntries(timeEntriesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch billing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('workDescription', workDescription);
      workDocuments.forEach(file => formData.append('workDocuments', file));

      const response = await fetch(`/api/billing/submit-work/${paymentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work submitted successfully"
        });
        setWorkSubmissionDialog({ open: false });
        setWorkDescription('');
        setWorkDocuments([]);
        fetchBillingData();
      } else {
        throw new Error('Failed to submit work');
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      toast({
        title: "Error",
        description: "Failed to submit work",
        variant: "destructive"
      });
    }
  };

  const handleRaiseDispute = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/billing/raise-dispute/${paymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: disputeReason })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Dispute raised successfully"
        });
        setDisputeDialog({ open: false });
        setDisputeReason('');
        fetchBillingData();
      } else {
        throw new Error('Failed to raise dispute');
      }
    } catch (error) {
      console.error('Error raising dispute:', error);
      toast({
        title: "Error",
        description: "Failed to raise dispute",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'received': return 'default';
      case 'work_submitted': return 'outline';
      case 'approved': return 'default';
      case 'released': return 'default';
      case 'disputed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'received': return <DollarSign className="h-4 w-4" />;
      case 'work_submitted': return <FileText className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'released': return <CheckCircle className="h-4 w-4" />;
      case 'disputed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing Management</h1>
          <p className="text-muted-foreground">Manage your payments and billing</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingPayments)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unbilled Hours</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unbilledHours.toFixed(1)}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Hourly Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageHourlyRate)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="time-entries">Time Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4">
            {payments.map((payment) => (
              <Card key={payment._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{payment.caseId?.title || 'Unknown Case'}</CardTitle>
                      <CardDescription>
                        Case #{payment.caseId?.caseNumber} • Client: {payment.clientId?.name}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(payment.status)}
                        {payment.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Amount</Label>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">GST (18%)</Label>
                      <p className="font-medium">{formatCurrency(payment.gstAmount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Total</Label>
                      <p className="font-medium">{formatCurrency(payment.totalAmount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Payment Method</Label>
                      <p className="font-medium">{payment.paymentMethod}</p>
                    </div>
                  </div>

                  {payment.status === 'received' && (
                    <div className="flex gap-2">
                      <Dialog 
                        open={workSubmissionDialog.open && workSubmissionDialog.payment?._id === payment._id}
                        onOpenChange={(open) => setWorkSubmissionDialog({ open, payment: open ? payment : undefined })}
                      >
                        <DialogTrigger asChild>
                          <Button>Submit Work</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Submit Work</DialogTitle>
                            <DialogDescription>
                              Submit your completed work for client review
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="work-description">Work Description</Label>
                              <Textarea
                                id="work-description"
                                placeholder="Describe the work completed..."
                                value={workDescription}
                                onChange={(e) => setWorkDescription(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="work-documents">Supporting Documents</Label>
                              <Input
                                id="work-documents"
                                type="file"
                                multiple
                                onChange={(e) => setWorkDocuments(Array.from(e.target.files || []))}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setWorkSubmissionDialog({ open: false })}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleSubmitWork(payment._id)}>
                              Submit Work
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {payment.status === 'work_submitted' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Work Submitted</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Waiting for client review and approval
                      </p>
                      {payment.workDescription && (
                        <p className="text-sm mt-2">{payment.workDescription}</p>
                      )}
                    </div>
                  )}

                  {payment.status === 'approved' && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Work Approved</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Payment will be released after escrow period
                      </p>
                    </div>
                  )}

                  {payment.status === 'released' && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Payment Released</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Payment has been transferred to your account
                      </p>
                    </div>
                  )}

                  {payment.status === 'disputed' && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Payment Disputed</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        {payment.disputeReason}
                      </p>
                    </div>
                  )}

                  {(payment.status === 'work_submitted' || payment.status === 'approved') && (
                    <div className="flex justify-end">
                      <Dialog 
                        open={disputeDialog.open && disputeDialog.payment?._id === payment._id}
                        onOpenChange={(open) => setDisputeDialog({ open, payment: open ? payment : undefined })}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Raise Dispute
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Raise Dispute</DialogTitle>
                            <DialogDescription>
                              Please explain the reason for raising a dispute
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="dispute-reason">Dispute Reason</Label>
                              <Textarea
                                id="dispute-reason"
                                placeholder="Describe the issue..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDisputeDialog({ open: false })}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={() => handleRaiseDispute(payment._id)}>
                              Raise Dispute
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {payments.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Payments Found</h3>
                  <p className="text-muted-foreground">You don't have any payments yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="time-entries" className="space-y-4">
          <div className="grid gap-4">
            {timeEntries.map((entry) => (
              <Card key={entry._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{entry.caseId?.title || 'Unknown Case'}</CardTitle>
                      <CardDescription>
                        {new Date(entry.date).toLocaleDateString()} • {entry.activityType}
                      </CardDescription>
                    </div>
                    <Badge variant={entry.status === 'approved' ? 'default' : entry.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {entry.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Duration</Label>
                      <p className="font-medium">{(entry.duration / 60).toFixed(2)} hours</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Hourly Rate</Label>
                      <p className="font-medium">{formatCurrency(entry.hourlyRate)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Amount</Label>
                      <p className="font-medium">{formatCurrency(entry.amount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foregroup">Billable</Label>
                      <p className="font-medium">{entry.billable ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  {entry.description && (
                    <div className="mt-4">
                      <Label className="text-sm text-muted-foreground">Description</Label>
                      <p className="text-sm">{entry.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {timeEntries.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Time Entries Found</h3>
                  <p className="text-muted-foreground">You don't have any time entries yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingManagement;