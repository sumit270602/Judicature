
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Key, Eye, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

const Security = () => {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: true,
    encryptedStorage: true,
    activityLogging: true,
    autoLogout: false,
    ipRestriction: false
  });

  const securityEvents = [
    {
      id: 1,
      type: 'login',
      description: 'Successful login from Chrome on Windows',
      location: 'New York, NY',
      timestamp: '2 hours ago',
      severity: 'low'
    },
    {
      id: 2,
      type: 'access',
      description: 'Accessed confidential document - Smith Case',
      location: 'Office Network',
      timestamp: '4 hours ago',
      severity: 'medium'
    },
    {
      id: 3,
      type: 'export',
      description: 'Downloaded client data export',
      location: 'New York, NY',
      timestamp: '1 day ago',
      severity: 'high'
    },
    {
      id: 4,
      type: 'settings',
      description: 'Security settings updated',
      location: 'Office Network',
      timestamp: '2 days ago',
      severity: 'medium'
    }
  ];

  const complianceStandards = [
    { name: 'SOC 2 Type II', status: 'Compliant', icon: CheckCircle, color: 'text-green-600' },
    { name: 'GDPR', status: 'Compliant', icon: CheckCircle, color: 'text-green-600' },
    { name: 'HIPAA', status: 'Compliant', icon: CheckCircle, color: 'text-green-600' },
    { name: 'PCI DSS', status: 'Compliant', icon: CheckCircle, color: 'text-green-600' },
    { name: 'ISO 27001', status: 'In Progress', icon: AlertTriangle, color: 'text-yellow-600' }
  ];

  const handleSecurityToggle = (key: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return Key;
      case 'access': return Eye;
      case 'export': return Activity;
      case 'settings': return Shield;
      default: return Activity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-4 bg-legal-navy text-white">
            🔒 Enterprise Security
          </Badge>
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Security & Compliance
          </h1>
          <p className="text-xl text-gray-600">
            Bank-level encryption, compliance standards, and secure data management for legal professionals.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Security Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Security Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Score
                </CardTitle>
                <CardDescription>
                  Your current security posture assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">94%</div>
                        <div className="text-sm text-gray-600">Excellent</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-sm text-gray-600">Secure Features</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">1</div>
                    <div className="text-sm text-gray-600">Recommendations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Vulnerabilities</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Security Activity
                </CardTitle>
                <CardDescription>
                  Monitor access and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.map((event) => {
                    const EventIcon = getEventIcon(event.type);
                    return (
                      <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${getSeverityColor(event.severity)}`}>
                            <EventIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900">{event.description}</h3>
                              <Badge variant={event.severity === 'high' ? 'destructive' : 'secondary'}>
                                {event.severity}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span>{event.location}</span> • <span>{event.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Standards */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Standards</CardTitle>
                <CardDescription>
                  Industry certifications and compliance status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {complianceStandards.map((standard) => {
                    const StatusIcon = standard.icon;
                    return (
                      <div key={standard.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`h-5 w-5 ${standard.color}`} />
                          <span className="font-medium">{standard.name}</span>
                        </div>
                        <Badge variant={standard.status === 'Compliant' ? 'default' : 'secondary'}>
                          {standard.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Settings Sidebar */}
          <div className="space-y-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure your security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twoFactor" className="text-sm">
                    Two-Factor Authentication
                  </Label>
                  <Switch
                    id="twoFactor"
                    checked={securitySettings.twoFactor}
                    onCheckedChange={() => handleSecurityToggle('twoFactor')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="encryptedStorage" className="text-sm">
                    Encrypted File Storage
                  </Label>
                  <Switch
                    id="encryptedStorage"
                    checked={securitySettings.encryptedStorage}
                    onCheckedChange={() => handleSecurityToggle('encryptedStorage')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activityLogging" className="text-sm">
                    Activity Logging
                  </Label>
                  <Switch
                    id="activityLogging"
                    checked={securitySettings.activityLogging}
                    onCheckedChange={() => handleSecurityToggle('activityLogging')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoLogout" className="text-sm">
                    Auto Logout (30 min)
                  </Label>
                  <Switch
                    id="autoLogout"
                    checked={securitySettings.autoLogout}
                    onCheckedChange={() => handleSecurityToggle('autoLogout')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ipRestriction" className="text-sm">
                    IP Address Restriction
                  </Label>
                  <Switch
                    id="ipRestriction"
                    checked={securitySettings.ipRestriction}
                    onCheckedChange={() => handleSecurityToggle('ipRestriction')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-l-4 border-yellow-500 pl-3">
                    <div className="font-medium text-sm">Enable IP Restriction</div>
                    <div className="text-xs text-gray-600">Limit access to trusted networks</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Security Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full text-left justify-start">
                    <Lock className="h-4 w-4 mr-2" />
                    Report Security Issue
                  </Button>
                  <Button variant="outline" className="w-full text-left justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Download Activity Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
