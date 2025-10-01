import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { CreditCard, DollarSign, Shield, AlertCircle, CheckCircle, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface PaymentFormProps {
  lawyerId: string;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

interface OrderData {
  lawyerId: string;
  serviceType: string;
  amount: number;
  currency: string;
  description: string;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentForm: React.FC<PaymentFormProps> = ({ lawyerId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>({
    lawyerId,
    serviceType: '',
    amount: 0,
    currency: 'inr',
    description: ''
  });

  const serviceTypes = [
    { value: 'consultation', label: 'Legal Consultation', basePrice: 2000 },
    { value: 'contract_review', label: 'Contract Review', basePrice: 5000 },
    { value: 'litigation', label: 'Litigation Support', basePrice: 10000 },
    { value: 'legal_research', label: 'Legal Research', basePrice: 3000 },
    { value: 'document_drafting', label: 'Document Drafting', basePrice: 4000 },
    { value: 'custom', label: 'Custom Service', basePrice: 0 }
  ];

  const handleServiceTypeChange = (serviceType: string) => {
    const service = serviceTypes.find(s => s.value === serviceType);
    setOrderData(prev => ({
      ...prev,
      serviceType,
      amount: service?.basePrice || prev.amount
    }));
  };

  const handleCreateOrder = async () => {
    if (!orderData.serviceType || !orderData.amount || !orderData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      const { data } = await api.post('/orders/create', orderData);
      const { orderId } = data;
      
      // Proceed to payment
      await handlePayment(orderId);
    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
      setIsProcessing(false);
    }
  };

  const handlePayment = async (orderId: string) => {
    if (!stripe || !elements) {
      toast.error('Stripe not loaded');
      setIsProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Process payment
      const { data } = await api.post(`/orders/${orderId}/pay`, {
        paymentMethodId: paymentMethod.id
      });

      const { clientSecret, requiresAction } = data;

      if (requiresAction) {
        // Handle 3D Secure or other authentication
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      toast.success('Payment successful! Funds are held in escrow until work completion.');
      onSuccess?.(orderId);
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast.error(error.response?.data?.message || error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotal = () => {
    const baseAmount = orderData.amount;
    const platformFee = Math.round(baseAmount * 0.029); // 2.9% platform fee
    const gst = Math.round((baseAmount + platformFee) * 0.18); // 18% GST
    return {
      baseAmount,
      platformFee,
      gst,
      total: baseAmount + platformFee + gst
    };
  };

  const totals = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-legal-navy" />
            Service Details
          </CardTitle>
          <CardDescription>Select the legal service you need</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select value={orderData.serviceType} onValueChange={handleServiceTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map(service => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label} {service.basePrice > 0 && `(₹${service.basePrice.toLocaleString()})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              min="100"
              value={orderData.amount}
              onChange={(e) => setOrderData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <Label htmlFor="description">Service Description *</Label>
            <Textarea
              id="description"
              value={orderData.description}
              onChange={(e) => setOrderData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the legal service you need..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      {orderData.amount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-legal-navy" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Service Amount</span>
                <span>₹{totals.baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Platform Fee (2.9%)</span>
                <span>₹{totals.platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>GST (18%)</span>
                <span>₹{totals.gst.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>₹{totals.total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-legal-navy" />
            Payment Method
          </CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-green-600" />
              Secure payment processed by Stripe. Funds held in escrow until work completion.
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </CardContent>
      </Card>

      {/* Escrow Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Escrow Protection</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your payment is securely held in escrow and will only be released to the lawyer 
                after you confirm the work has been completed to your satisfaction.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleCreateOrder}
          disabled={isProcessing || !stripe || !orderData.serviceType || !orderData.amount || !orderData.description}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ₹{totals.total.toLocaleString()}
            </>
          )}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;