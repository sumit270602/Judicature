import { useState } from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Fingerprint,
  Globe,
  Server,
  Database,
  Wifi,
  Smartphone,
  Monitor,
  FileText,
  Download,
  Upload,
  Settings,
  Users,
  Clock,
  MapPin,
  Zap,
  TrendingUp,
  BarChart,
  Target,
  Search,
  Filter,
  Bell,
  X,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

const Security = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: true,
    encryptedStorage: true,
    activityLogging: true,
    autoLogout: true,
    ipRestriction: true,
    ssoEnabled: true,
    biometricAuth: false,
    vpnRequired: true,
    deviceManagement: true,
    dataLossPrevention: true,
    threatDetection: true,
    auditLogging: true
  });

  // Enhanced security events with real legal context
  const securityEvents = [
    {
      id: 1,
      type: 'authentication',
      category: 'Multi-Factor Authentication',
      title: 'Biometric Authentication Success',
      description: 'User authenticated using fingerprint for case file access',
      user: 'Jennifer Walsh (Associate)',
      location: 'New York Office - Conference Room A',
      ipAddress: '192.168.1.45',
      device: 'iPhone 15 Pro',
      timestamp: '15 minutes ago',
      severity: 'info',
      caseAccessed: 'CASE-2024-001',
      dataClassification: 'Confidential',
      complianceFlags: ['SOC2', 'HIPAA']
    },
    {
      id: 2,
      type: 'data_access',
      category: 'Data Access Control',
      title: 'Privileged Document Access',
      description: 'Accessed attorney-client privileged documents with proper authorization',
      user: 'You (Senior Partner)',
      location: 'New York Office - Private Office',
      ipAddress: '192.168.1.12',
      device: 'MacBook Pro (Law-Firm-001)',
      timestamp: '1 hour ago',
      severity: 'medium',
      caseAccessed: 'CASE-2024-003',
      dataClassification: 'Attorney-Client Privileged',
      complianceFlags: ['Legal Professional Privilege', 'SOC2']
    },
    {
      id: 3,
      type: 'threat_detection',
      category: 'AI Threat Detection',
      title: 'Suspicious Access Pattern Blocked',
      description: 'AI detected unusual file access pattern and blocked potential data exfiltration',
      user: 'System AI',
      location: 'Cloud Infrastructure',
      ipAddress: '203.45.67.89',
      device: 'Unknown Device',
      timestamp: '3 hours ago',
      severity: 'critical',
      caseAccessed: 'Multiple Cases',
      dataClassification: 'Highly Confidential',
      complianceFlags: ['Automatic Threat Response', 'Zero Trust']
    },
    {
      id: 4,
      type: 'compliance',
      category: 'Compliance Monitoring',
      title: 'GDPR Data Processing Audit',
      description: 'Automated compliance check completed for EU client data processing',
      user: 'Compliance System',
      location: 'EU Data Center',
      ipAddress: 'Internal System',
      device: 'Compliance Scanner',
      timestamp: '6 hours ago',
      severity: 'info',
      caseAccessed: 'CASE-2024-002',
      dataClassification: 'Personal Data (GDPR)',
      complianceFlags: ['GDPR Article 32', 'Data Protection']
    },
    {
      id: 5,
      type: 'encryption',
      category: 'Encryption Management',
      title: 'Document Encryption Key Rotation',
      description: 'Automated key rotation completed for all case documents',
      user: 'Key Management System',
      location: 'Security Infrastructure',
      ipAddress: 'Internal System',
      device: 'HSM (Hardware Security Module)',
      timestamp: '12 hours ago',
      severity: 'info',
      caseAccessed: 'All Active Cases',
      dataClassification: 'All Classifications',
      complianceFlags: ['FIPS 140-2', 'AES-256']
    }
  ];

  // Comprehensive compliance standards with real legal requirements
  const complianceStandards = [
    { 
      name: 'SOC 2 Type II', 
      status: 'Compliant', 
      icon: CheckCircle, 
      color: 'text-green-600',
      lastAudit: '2024-01-15',
      nextAudit: '2025-01-15',
      description: 'Service Organization Control 2 - Security, Availability, Processing Integrity'
    },
    { 
      name: 'GDPR', 
      status: 'Compliant', 
      icon: CheckCircle, 
      color: 'text-green-600',
      lastAudit: '2024-01-10',
      nextAudit: '2024-07-10',
      description: 'General Data Protection Regulation - EU Privacy Requirements'
    },
    { 
      name: 'HIPAA', 
      status: 'Compliant', 
      icon: CheckCircle, 
      color: 'text-green-600',
      lastAudit: '2023-12-20',
      nextAudit: '2024-12-20',
      description: 'Health Insurance Portability and Accountability Act'
    },
    { 
      name: 'Legal Professional Privilege', 
      status: 'Compliant', 
      icon: CheckCircle, 
      color: 'text-green-600',
      lastAudit: '2024-01-20',
      nextAudit: 'Continuous',
      description: 'Attorney-Client Privilege Protection Standards'
    },
    { 
      name: 'ISO 27001', 
      status: 'In Progress', 
      icon: AlertTriangle, 
      color: 'text-yellow-600',
      lastAudit: '2023-10-15',
      nextAudit: '2024-02-15',
      description: 'International Standard for Information Security Management'
    },
    { 
      name: 'CCPA', 
      status: 'Compliant', 
      icon: CheckCircle, 
      color: 'text-green-600',
      lastAudit: '2024-01-05',
      nextAudit: '2024-07-05',
      description: 'California Consumer Privacy Act Compliance'
    }
  ];

  // Security metrics and analytics
  const securityMetrics = {
    securityScore: 96,
    threatsBlocked: 47,
    complianceRate: 98.7,
    uptime: 99.99,
    encryptionCoverage: 100,
    accessAttempts: 1247,
    successfulLogins: 1203,
    blockedAttempts: 44,
    avgResponseTime: '0.3ms',
    dataBreaches: 0
  };

  // Active security policies
  const securityPolicies = [
    {
      id: 1,
      name: 'Zero Trust Architecture',
      description: 'Never trust, always verify - comprehensive identity verification',
      enabled: true,
      lastUpdated: '2024-01-20',
      coverage: '100%'
    },
    {
      id: 2,
      name: 'Data Loss Prevention (DLP)',
      description: 'Prevent unauthorized data exfiltration and sharing',
      enabled: true,
      lastUpdated: '2024-01-18',
      coverage: '98%'
    },
    {
      id: 3,
      name: 'Endpoint Detection & Response',
      description: 'Advanced threat detection on all connected devices',
      enabled: true,
      lastUpdated: '2024-01-22',
      coverage: '95%'
    },
    {
      id: 4,
      name: 'Privileged Access Management',
      description: 'Secure and monitor privileged user access',
      enabled: true,
      lastUpdated: '2024-01-19',
      coverage: '100%'
    }
  ];

  const handleSecurityToggle = (key: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'authentication': return Fingerprint;
      case 'data_access': return Eye;
      case 'threat_detection': return Shield;
      case 'compliance': return FileText;
      case 'encryption': return Lock;
      case 'login': return Key;
      case 'export': return Download;
      case 'settings': return Settings;
      default: return Activity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'info': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      case 'info': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge className="mb-4 bg-legal-navy text-white">
              🔒 Live Enterprise Security
            </Badge>
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Military-Grade Security & Compliance
            </h1>
            <p className="text-xl text-gray-600">
              Experience Judicature's zero-trust security architecture with AI threat detection, legal compliance monitoring, and attorney-client privilege protection.
            </p>
          </div>

          {/* Security Analytics Dashboard */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Security Score</p>
                    <p className="text-2xl font-bold text-legal-navy">{securityMetrics.securityScore}%</p>
                    <p className="text-xs text-green-600 mt-1">Excellent Rating</p>
                  </div>
                  <Shield className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Threats Blocked</p>
                    <p className="text-2xl font-bold text-legal-navy">{securityMetrics.threatsBlocked}</p>
                    <p className="text-xs text-red-600 mt-1">This month</p>
                  </div>
                  <Target className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="text-2xl font-bold text-legal-navy">{securityMetrics.uptime}%</p>
                    <p className="text-xs text-green-600 mt-1">99.99% SLA</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Compliance</p>
                    <p className="text-2xl font-bold text-legal-navy">{securityMetrics.complianceRate}%</p>
                    <p className="text-xs text-green-600 mt-1">All standards met</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-lg grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button className="bg-legal-navy hover:bg-legal-navy/90">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Security Score Card */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Security Posture Analysis
                    </CardTitle>
                    <CardDescription>
                      Real-time security assessment with AI-powered threat detection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{securityMetrics.securityScore}%</div>
                            <div className="text-sm text-gray-600">Military Grade</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">24</div>
                        <div className="text-sm text-gray-600">Security Controls</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">0</div>
                        <div className="text-sm text-gray-600">Vulnerabilities</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">100%</div>
                        <div className="text-sm text-gray-600">Encryption</div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="font-medium">Active Security Policies</h4>
                      {securityPolicies.map((policy) => (
                        <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${policy.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <div>
                              <h5 className="font-medium text-sm">{policy.name}</h5>
                              <p className="text-xs text-gray-600">{policy.description}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{policy.coverage}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Sidebar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Security Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Encryption Coverage</span>
                        <Badge className="bg-green-100 text-green-800">{securityMetrics.encryptionCoverage}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Access Attempts</span>
                        <Badge variant="outline">{securityMetrics.accessAttempts.toLocaleString()}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Successful Logins</span>
                        <Badge className="bg-blue-100 text-blue-800">{securityMetrics.successfulLogins.toLocaleString()}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Blocked Attempts</span>
                        <Badge className="bg-red-100 text-red-800">{securityMetrics.blockedAttempts}</Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">Response Times</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Avg Response</span>
                          <span className="text-xs font-medium">{securityMetrics.avgResponseTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Data Breaches</span>
                          <span className="text-xs font-medium text-green-600">{securityMetrics.dataBreaches} (Zero)</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-legal-navy hover:bg-legal-navy/90 mt-4">
                      <Bell className="h-4 w-4 mr-2" />
                      Security Alerts
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Security Activity Log
                      </CardTitle>
                      <CardDescription>Real-time monitoring of all security events</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Log
                    </Button>
                  </div>
                  
                  <div className="flex gap-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search security events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select 
                      className="border rounded-md px-3 py-2"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="authentication">Authentication</option>
                      <option value="data_access">Data Access</option>
                      <option value="threat_detection">Threats</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredEvents.map((event) => {
                      const EventIcon = getEventIcon(event.type);
                      return (
                        <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-full ${getSeverityColor(event.severity)}`}>
                              <EventIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                  <p className="text-xs text-gray-500 mb-1">{event.category}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getSeverityBadge(event.severity)}>
                                    {event.severity}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                              
                              <div className="grid md:grid-cols-3 gap-4 text-xs text-gray-500 mb-3">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {event.user}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  {event.device}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {event.ipAddress}
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {event.caseAccessed}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  {event.dataClassification}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                  {event.complianceFlags.map((flag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {flag}
                                    </Badge>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-400">{event.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Legal Compliance Standards
                  </CardTitle>
                  <CardDescription>
                    Comprehensive compliance monitoring for legal industry requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {complianceStandards.map((standard) => {
                      const StatusIcon = standard.icon;
                      return (
                        <div key={standard.name} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <StatusIcon className={`h-6 w-6 ${standard.color}`} />
                              <div>
                                <h3 className="font-semibold">{standard.name}</h3>
                                <p className="text-xs text-gray-600">{standard.description}</p>
                              </div>
                            </div>
                            <Badge variant={standard.status === 'Compliant' ? 'default' : 'secondary'}>
                              {standard.status}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex justify-between">
                              <span>Last Audit:</span>
                              <span>{standard.lastAudit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Next Review:</span>
                              <span>{standard.nextAudit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-legal-navy/10 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-legal-navy mt-1" />
                      <div>
                        <h4 className="font-medium text-legal-navy">Attorney-Client Privilege Protection</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Our security architecture is specifically designed to protect attorney-client communications and maintain legal professional privilege under all applicable jurisdictions.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication & Access</CardTitle>
                    <CardDescription>Configure authentication methods and access controls</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        <Label className="text-sm">Multi-Factor Authentication</Label>
                      </div>
                      <Switch
                        checked={securitySettings.twoFactor}
                        onCheckedChange={() => handleSecurityToggle('twoFactor')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        <Label className="text-sm">Biometric Authentication</Label>
                      </div>
                      <Switch
                        checked={securitySettings.biometricAuth}
                        onCheckedChange={() => handleSecurityToggle('biometricAuth')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <Label className="text-sm">Single Sign-On (SSO)</Label>
                      </div>
                      <Switch
                        checked={securitySettings.ssoEnabled}
                        onCheckedChange={() => handleSecurityToggle('ssoEnabled')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <Label className="text-sm">Auto Logout (15 min)</Label>
                      </div>
                      <Switch
                        checked={securitySettings.autoLogout}
                        onCheckedChange={() => handleSecurityToggle('autoLogout')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Protection</CardTitle>
                    <CardDescription>Configure data encryption and protection settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <Label className="text-sm">End-to-End Encryption</Label>
                      </div>
                      <Switch
                        checked={securitySettings.encryptedStorage}
                        onCheckedChange={() => handleSecurityToggle('encryptedStorage')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <Label className="text-sm">Data Loss Prevention</Label>
                      </div>
                      <Switch
                        checked={securitySettings.dataLossPrevention}
                        onCheckedChange={() => handleSecurityToggle('dataLossPrevention')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <Label className="text-sm">Activity Monitoring</Label>
                      </div>
                      <Switch
                        checked={securitySettings.activityLogging}
                        onCheckedChange={() => handleSecurityToggle('activityLogging')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <Label className="text-sm">AI Threat Detection</Label>
                      </div>
                      <Switch
                        checked={securitySettings.threatDetection}
                        onCheckedChange={() => handleSecurityToggle('threatDetection')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Network Security</CardTitle>
                    <CardDescription>Configure network access and VPN settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <Label className="text-sm">IP Address Restriction</Label>
                      </div>
                      <Switch
                        checked={securitySettings.ipRestriction}
                        onCheckedChange={() => handleSecurityToggle('ipRestriction')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        <Label className="text-sm">VPN Required</Label>
                      </div>
                      <Switch
                        checked={securitySettings.vpnRequired}
                        onCheckedChange={() => handleSecurityToggle('vpnRequired')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <Label className="text-sm">Device Management</Label>
                      </div>
                      <Switch
                        checked={securitySettings.deviceManagement}
                        onCheckedChange={() => handleSecurityToggle('deviceManagement')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Actions</CardTitle>
                    <CardDescription>Security incident response and reporting</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Security Incident
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Download Security Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Lock className="h-4 w-4 mr-2" />
                      Emergency Account Lockdown
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Security;
