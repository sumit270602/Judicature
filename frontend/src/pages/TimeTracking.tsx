
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Play, Pause, Square, Timer, DollarSign, Calendar, BarChart3 } from 'lucide-react';

const TimeTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [selectedCase, setSelectedCase] = useState('');

  const timeEntries = [
    {
      id: 1,
      case: 'Smith vs. ABC Corp',
      task: 'Document Review',
      duration: '2h 30m',
      rate: 250,
      total: 625,
      date: '2024-01-20',
      billable: true
    },
    {
      id: 2,
      case: 'Johnson Employment',
      task: 'Client Consultation',
      duration: '1h 15m',
      rate: 300,
      total: 375,
      date: '2024-01-20',
      billable: true
    },
    {
      id: 3,
      case: 'Wilson Property',
      task: 'Legal Research',
      duration: '45m',
      rate: 200,
      total: 150,
      date: '2024-01-19',
      billable: false
    },
    {
      id: 4,
      case: 'Brown Corporation',
      task: 'Contract Drafting',
      duration: '3h 20m',
      rate: 275,
      total: 916.67,
      date: '2024-01-19',
      billable: true
    }
  ];

  const handleStartStop = () => {
    setIsTracking(!isTracking);
    // TODO: Implement actual timer logic
  };

  const totalBillableHours = timeEntries
    .filter(entry => entry.billable)
    .reduce((total, entry) => {
      const hours = parseFloat(entry.duration.replace('h', '').replace('m', '')) || 0;
      return total + hours;
    }, 0);

  const totalRevenue = timeEntries
    .filter(entry => entry.billable)
    .reduce((total, entry) => total + entry.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-4 bg-legal-navy text-white">
            ⏱️ Time Tracking
          </Badge>
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Time Tracking & Billing
          </h1>
          <p className="text-xl text-gray-600">
            Automated time tracking for billable hours with detailed reporting and analytics.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timer and Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Active Timer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="h-5 w-5 mr-2" />
                  Active Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-legal-navy mb-2">
                    {currentTime}
                  </div>
                  <div className="text-sm text-gray-600">Current Session</div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="case-select">Select Case</Label>
                  <Input 
                    id="case-select" 
                    placeholder="Choose a case..."
                    value={selectedCase}
                    onChange={(e) => setSelectedCase(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-description">Task Description</Label>
                  <Textarea 
                    id="task-description" 
                    placeholder="What are you working on?"
                    rows={2}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleStartStop}
                    className={`flex-1 ${isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isTracking ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-legal-navy mx-auto mb-2" />
                  <div className="text-2xl font-bold">{totalBillableHours.toFixed(1)}h</div>
                  <div className="text-sm text-gray-600">This Week</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Cases */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Smith vs. ABC Corp', 'Johnson Employment', 'Wilson Property'].map((caseName) => (
                    <Button 
                      key={caseName} 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-xs"
                      onClick={() => setSelectedCase(caseName)}
                    >
                      {caseName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Entries */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Time Entries
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button size="sm" className="bg-legal-navy hover:bg-legal-navy/90">
                      Export Report
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Track and manage your billable hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{entry.case}</h3>
                          <p className="text-sm text-gray-600">{entry.task}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={entry.billable ? 'default' : 'secondary'}>
                            {entry.billable ? 'Billable' : 'Non-billable'}
                          </Badge>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <div className="font-medium">{entry.duration}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Rate:</span>
                          <div className="font-medium">${entry.rate}/hr</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <div className="font-medium">${entry.total}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <div className="font-medium">{entry.date}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
