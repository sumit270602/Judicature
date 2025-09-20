import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/ClientDashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import MessagingDemo from "./pages/MessagingDemo";
import AuthSuccess from "./pages/AuthSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            <Route path="/dashboard/client" element={<ClientDashboard />} />
            <Route path="/dashboard/lawyer" element={<LawyerDashboard />} />
            <Route path="/messaging" element={<MessagingDemo />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
