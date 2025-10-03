import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import StripeProvider from "@/components/StripeProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/EnhancedRegister";
import Features from "./pages/Features";
import About from "./pages/About";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import CaseAnalysis from "./pages/CaseAnalysis";
import ClientManagement from "./pages/ClientManagement";
import Communication from "./pages/Communication";
import Scheduling from "./pages/Scheduling";
import Alerts from "./pages/Alerts";
import Security from "./pages/Security";
import Search from "./pages/Search";
import TimeTracking from "./pages/TimeTracking";
import BillingManagement from "./pages/BillingManagement";
import PaymentHistory from "./pages/PaymentHistory";
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/ClientDashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import MessagingDemo from "./pages/MessagingDemo";
import AuthSuccess from "./pages/AuthSuccess";
import CreateCase from "./pages/CreateCase";
import CaseDetails from "./pages/CaseDetails";
import CaseDetailsView from "./pages/CaseDetailsView";
import Services from "./pages/Services";
import BillingPage from "./pages/BillingPage";
import PaymentDetailsPage from "./pages/PaymentDetailsPage";
import LawyerRateManagement from "./pages/LawyerRateManagement";
import WorkItemManagement from "./pages/WorkItemManagement";
import EnhancedBillingDashboard from "./pages/EnhancedBillingDashboard";
import OrdersPage from "./pages/OrdersPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import LawyerClientDetails from "./pages/LawyerClientDetails";

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
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/payment/:paymentId" element={<PaymentDetailsPage />} />
            <Route path="/dashboard/client" element={<ClientDashboard />} />
            <Route path="/dashboard/lawyer" element={<LawyerDashboard />} />
            <Route path="/lawyer/clients/:clientId" element={<LawyerClientDetails />} />
            <Route path="/messaging" element={<MessagingDemo />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/create-case" element={<CreateCase />} />
            <Route path="/case/:caseId" element={<CaseDetails />} />
            <Route path="/case/:caseId/view" element={<CaseDetailsView />} />
            <Route path="/services" element={<Services />} />
            {/* Enhanced Payment System Routes */}
            <Route path="/lawyer/rates" element={<LawyerRateManagement />} />
            <Route path="/work-items" element={<WorkItemManagement />} />
            <Route path="/enhanced-billing" element={<EnhancedBillingDashboard />} />
            {/* Stripe Connect Escrow Routes */}
            <Route path="/orders" element={<OrdersPage />} />
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
