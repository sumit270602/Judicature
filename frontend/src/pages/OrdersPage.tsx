import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderManagement from '@/components/OrderManagement';

const OrdersPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-legal-navy mb-4">Access Denied</h1>
              <p className="text-muted-foreground">Please log in to view your orders.</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-legal-navy mb-2">
              {user.role === 'client' ? 'My Orders' : 'Client Orders'}
            </h1>
            <p className="text-slate-600">
              {user.role === 'client' 
                ? 'Track your legal service orders and manage payments' 
                : 'Manage client orders, deliverables, and payments'
              }
            </p>
          </div>
          
          <OrderManagement 
            userRole={user.role as 'client' | 'lawyer'} 
            userId={user.id} 
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrdersPage;