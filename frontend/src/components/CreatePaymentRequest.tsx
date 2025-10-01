import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Send, 
  User, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface Client {
  _id: string;
  name: string;
  email: string;
}

const CreatePaymentRequest: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    serviceType: '',
    description: '',
    urgency: 'medium',
    estimatedDeliveryDays: '7'
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/payment-requests/clients');
      setClients(data.clients || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.amount || !formData.serviceType || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/payment-requests', {
        clientId: formData.clientId,
        amount: parseFloat(formData.amount),
        serviceType: formData.serviceType,
        description: formData.description,
        urgency: formData.urgency,
        estimatedDeliveryDays: parseInt(formData.estimatedDeliveryDays)
      });

      toast.success('Payment request sent successfully!');
      
      // Reset form
      setFormData({
        clientId: '',
        amount: '',
        serviceType: '',
        description: '',
        urgency: 'medium',
        estimatedDeliveryDays: '7'
      });

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create payment request');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const gst = amount * 0.18;
    const platformFee = amount * 0.029;
    return {
      baseAmount: amount,
      gst: Math.round(gst),
      platformFee: Math.round(platformFee),
      total: Math.round(amount + gst + platformFee)
    };
  };

  const totals = calculateTotal();

  const serviceTypes = [
    { value: 'consultation', label: 'Legal Consultation' },
    { value: 'document_review', label: 'Document Review' },
    { value: 'contract_drafting', label: 'Contract Drafting' },
    { value: 'legal_research', label: 'Legal Research' },
    { value: 'court_representation', label: 'Court Representation' },
    { value: 'legal_notice', label: 'Legal Notice' },
    { value: 'other', label: 'Other Legal Service' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-legal-navy" />
            Create Payment Request
          </CardTitle>
          <CardDescription>
            Send a secure payment request to your client for legal services
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">Select Client *</Label>
              <Select 
                value={formData.clientId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{client.name}</span>
                        <span className="text-gray-500">({client.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select 
                value={formData.serviceType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Service Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                min="100"
                step="1"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount in rupees"
                className="text-right"
              />
              <p className="text-sm text-gray-500">
                Minimum amount: ₹100
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Service Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the legal service you will provide..."
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Priority & Delivery */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="urgency">Priority Level</Label>
                <Select 
                  value={formData.urgency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <Badge className={level.color}>
                          {level.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDays">Estimated Delivery (Days)</Label>
                <Input
                  id="deliveryDays"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.estimatedDeliveryDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryDays: e.target.value }))}
                />
              </div>
            </div>

            {/* Payment Summary */}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Service Amount:</span>
                    <span>₹{totals.baseAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{totals.gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (2.9%):</span>
                    <span>₹{totals.platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span className="text-legal-navy">₹{totals.total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Payment Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Your client will receive a notification about the payment request</li>
                <li>• They can accept or reject the request within 7 days</li>
                <li>• Once accepted, they can proceed with secure payment</li>
                <li>• Funds are held in escrow until service completion</li>
                <li>• You'll receive payment after successful service delivery</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePaymentRequest;