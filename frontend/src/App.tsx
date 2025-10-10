import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import StripeProvider from '@/components/StripeProvider';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/EnhancedRegister';
import OAuthRoleSelection from './pages/OAuthRoleSelection';
import OAuthCallback from './pages/OAuthCallback';
import Features from './pages/Features';
import About from './pages/About';
import Testimonials from './pages/Testimonials';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import CaseAnalysis from './pages/CaseAnalysis';
import ClientManagement from './pages/ClientManagement';
import Communication from './pages/Communication';
import Scheduling from './pages/Scheduling';
import Alerts from './pages/Alerts';
import Security from './pages/Security';
import Search from './pages/Search';
import TimeTracking from './pages/TimeTracking';
import BillingManagement from './pages/BillingManagement';
import PaymentHistory from './pages/PaymentHistory';
import NotFound from './pages/NotFound';
import ClientDashboard from './pages/ClientDashboard';
import LawyerDashboard from './pages/LawyerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import AuthGuard from './components/AuthGuard';
import MessagingDemo from './pages/MessagingDemo';
import AuthSuccess from './pages/AuthSuccess';
import CreateCase from './pages/CreateCase';
import CaseDetails from './pages/CaseDetails';
import CaseDetailsView from './pages/CaseDetailsView';
import VerificationDetailsPage from './pages/VerificationDetailsPage';
import AdminCaseDetailsPage from './pages/AdminCaseDetailsPage';
import Services from './pages/Services';
import BillingPage from './pages/BillingPage';
import PaymentDetailsPage from './pages/PaymentDetailsPage';
import LawyerRateManagement from './pages/LawyerRateManagement';
import WorkItemManagement from './pages/WorkItemManagement';
import EnhancedBillingDashboard from './pages/EnhancedBillingDashboard';
import OrdersPage from './pages/OrdersPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import LawyerClientDetails from './pages/LawyerClientDetails';
import UserDetailsPage from './pages/UserDetailsPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StripeProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/oauth/role-selection" element={<OAuthRoleSelection />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/case-analysis" element={<CaseAnalysis />} />
            <Route path="/client-management" element={<ClientManagement />} /> 
            <Route path="/communication" element={<Communication />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/security" element={<Security />} />
            <Route path="/search" element={<Search />} />
            <Route path="/time-tracking" element={<TimeTracking />} />
            <Route path="/billing-management" element={<BillingManagement />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/billing" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer', 'admin']}>
                  <BillingPage />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/payment/:paymentId" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer', 'admin']}>
                  <PaymentDetailsPage />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/dashboard/client" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client']}>
                  <ClientDashboard />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/dashboard/lawyer" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['lawyer']}>
                  <LawyerDashboard />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/dashboard/admin" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/admin" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/admin/users/:userId/details" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <UserDetailsPage />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/admin/verification/:userId" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <VerificationDetailsPage />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/admin/cases/:caseId" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <AdminCaseDetailsPage />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/lawyer/clients/:clientId" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['lawyer']}>
                  <LawyerClientDetails />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/messaging" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer', 'admin']}>
                  <MessagingDemo />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/create-case" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer']}>
                  <CreateCase />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/case/:caseId" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer', 'admin']}>
                  <CaseDetails />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/case/:caseId/view" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer', 'admin']}>
                  <CaseDetailsView />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/services" element={<Services />} />
            {/* Enhanced Payment System Routes */}
            <Route path="/lawyer/rates" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['lawyer']}>
                  <LawyerRateManagement />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/work-items" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer']}>
                  <WorkItemManagement />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            <Route path="/enhanced-billing" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer', 'admin']}>
                  <EnhancedBillingDashboard />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            {/* Stripe Connect Escrow Routes */}
            <Route path="/orders" element={
              <AuthGuard>
                <RoleBasedRoute allowedRoles={['client', 'lawyer', 'admin']}>
                  <OrdersPage />
                </RoleBasedRoute>
              </AuthGuard>
            } />
            {/* Payment Result Routes */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </StripeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
