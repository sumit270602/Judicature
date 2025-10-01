import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  DollarSign,
  Clock,
  FileText,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface StripeAccount {
  id: string;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
  capabilities: {
    transfers: string;
    card_payments: string;
  };
}

interface PayoutInfo {
  balance: {
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  };
  nextPayoutDate?: string;
}

interface LawyerOnboardingProps {
  user: {
    id: string;
    email: string;
    name: string;
    stripeAccountId?: string;
    stripeOnboardingComplete?: boolean;
  };
}

const LawyerOnboarding: React.FC<LawyerOnboardingProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null);
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [onboardingData, setOnboardingData] = useState({
    businessType: 'individual',
    country: 'IN'
  });

  useEffect(() => {
    if (user.stripeAccountId) {
      fetchAccountStatus();
    }
  }, [user.stripeAccountId]);

  const fetchAccountStatus = async () => {
    try {
      const { data } = await api.get('/stripe-connect/account-status');
      setStripeAccount(data.account);
      setPayoutInfo(data.payoutInfo);
    } catch (error) {
      console.error('Failed to fetch account status:', error);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/stripe-connect/create-account', {
        email: user.email,
        country: onboardingData.country,
        businessType: onboardingData.businessType
      });
      
      toast.success('Stripe account created successfully');
      await fetchAccountStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/stripe-connect/complete-onboarding');
      
      if (data.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
        toast.success('Redirecting to Stripe onboarding...');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start onboarding');
    } finally {
      setLoading(false);
    }
  };

  const getOnboardingProgress = () => {
    if (!stripeAccount) return 0;
    
    let progress = 0;
    if (stripeAccount.detailsSubmitted) progress += 40;
    if (stripeAccount.capabilities.card_payments === 'active') progress += 30;
    if (stripeAccount.capabilities.transfers === 'active') progress += 30;
    
    return progress;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  // No Stripe account yet
  if (!user.stripeAccountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-legal-navy" />
            Payment Account Setup
          </CardTitle>
          <CardDescription>
            Set up your Stripe Connect account to receive payments from clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You need to set up a payment account to receive client payments. 
              This is required for the escrow payment system.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label>Business Type</Label>
              <Select 
                value={onboardingData.businessType} 
                onValueChange={(value) => setOnboardingData(prev => ({ ...prev, businessType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Country</Label>
              <Select 
                value={onboardingData.country} 
                onValueChange={(value) => setOnboardingData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCreateAccount} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Create Payment Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Account exists but onboarding incomplete
  if (!user.stripeOnboardingComplete) {
    const progress = getOnboardingProgress();
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-legal-navy" />
            Complete Account Setup
          </CardTitle>
          <CardDescription>
            Complete your account verification to start receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Setup Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {stripeAccount?.requirements.currently_due.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="mb-2">Required information needed:</div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {stripeAccount.requirements.currently_due.map((requirement, idx) => (
                    <li key={idx}>{requirement.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {stripeAccount?.detailsSubmitted ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-500" />
                )}
              </div>
              <div className="text-sm font-medium">Details</div>
              <div className="text-xs text-muted-foreground">
                {stripeAccount?.detailsSubmitted ? 'Submitted' : 'Pending'}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {stripeAccount?.payoutsEnabled ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-500" />
                )}
              </div>
              <div className="text-sm font-medium">Payouts</div>
              <div className="text-xs text-muted-foreground">
                {stripeAccount?.payoutsEnabled ? 'Enabled' : 'Pending'}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCompleteOnboarding} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Complete Setup on Stripe
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Account fully set up
  return (
    <div className="space-y-6">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Payment Account Active
          </CardTitle>
          <CardDescription>
            Your account is verified and ready to receive payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <CreditCard className="h-6 w-6 mx-auto mb-2 text-legal-navy" />
              <div className="text-sm font-medium">Payments</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-legal-navy" />
              <div className="text-sm font-medium">Payouts</div>
              <div className="text-xs text-green-600">Enabled</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-6 w-6 mx-auto mb-2 text-legal-navy" />
              <div className="text-sm font-medium">Escrow</div>
              <div className="text-xs text-green-600">Protected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Information */}
      {payoutInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-legal-navy" />
              Account Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  {payoutInfo.balance.available.length > 0 
                    ? formatCurrency(payoutInfo.balance.available[0].amount, payoutInfo.balance.available[0].currency)
                    : '₹0.00'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-yellow-600">
                  {payoutInfo.balance.pending.length > 0 
                    ? formatCurrency(payoutInfo.balance.pending[0].amount, payoutInfo.balance.pending[0].currency)
                    : '₹0.00'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
            
            {payoutInfo.nextPayoutDate && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Next payout: {new Date(payoutInfo.nextPayoutDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" onClick={fetchAccountStatus}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Payout History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LawyerOnboarding;