import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // You could verify the payment status here if needed
    // For now, we'll just show success and redirect after a delay
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleReturnToDashboard = () => {
    navigate('/dashboard/client');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {isProcessing ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600">Processing your payment...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
              
              {sessionId && (
                <p className="text-xs text-gray-500">
                  Transaction ID: {sessionId.substring(0, 20)}...
                </p>
              )}
              
              <Button 
                onClick={handleReturnToDashboard}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;