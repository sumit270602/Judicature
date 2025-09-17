import React from 'react';

// Placeholder components for each dashboard section
const LawyerHeaderCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white rounded-lg shadow p-4">Active Cases: <span className="font-bold">--</span></div>
    <div className="bg-white rounded-lg shadow p-4">Today's Hearings: <span className="font-bold">--</span></div>
    <div className="bg-white rounded-lg shadow p-4">Pending Tasks: <span className="font-bold">--</span></div>
    <div className="bg-white rounded-lg shadow p-4">Monthly Revenue: <span className="font-bold">--</span></div>
  </div>
);

const CaseManagementTable = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-lg font-semibold mb-2">Case Management</h2>
    <div className="text-gray-500">(Active cases, status, upcoming dates)</div>
  </div>
);

const ClientList = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-lg font-semibold mb-2">Client Management</h2>
    <div className="text-gray-500">(Client list, communication history)</div>
  </div>
);

const CourtSchedule = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-lg font-semibold mb-2">Court Schedule</h2>
    <div className="text-gray-500">(Upcoming hearings, deadlines, reminders)</div>
  </div>
);

const LegalResearch = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-lg font-semibold mb-2">Legal Research</h2>
    <div className="text-gray-500">(AI-powered research tools, case law search)</div>
  </div>
);

const DocumentManagement = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-lg font-semibold mb-2">Document Management</h2>
    <div className="text-gray-500">(Document templates, storage, sharing)</div>
  </div>
);

const TimeTracking = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-lg font-semibold mb-2">Time Tracking & Billing</h2>
    <div className="text-gray-500">(Time logs, invoice generation)</div>
  </div>
);

const TeamCollaboration = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-lg font-semibold mb-2">Team Collaboration</h2>
    <div className="text-gray-500">(Task delegation, internal messaging)</div>
  </div>
);

const Analytics = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-lg font-semibold mb-2">Analytics & Reports</h2>
    <div className="text-gray-500">(Case analytics, performance metrics)</div>
  </div>
);

const LawyerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy/10 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto">
        <LawyerHeaderCards />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CaseManagementTable />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ClientList />
              <CourtSchedule />
            </div>
            <LegalResearch />
            <DocumentManagement />
          </div>
          <div>
            <TimeTracking />
            <TeamCollaboration />
            <Analytics />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboard;