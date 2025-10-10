import { useState } from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  MapPin, 
  Video, 
  Phone, 
  Bell, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Repeat,
  Globe,
  Zap,
  BarChart,
  Calendar as CalendarIcon
} from 'lucide-react';

const Scheduling = () => {
  const [selectedDate, setSelectedDate] = useState('2024-01-23');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [viewMode, setViewMode] = useState('week');
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  
  // Enhanced appointment data with legal case context
  const appointments = [
    {
      id: 1,
      title: 'Contract Review Meeting',
      client: 'Sarah Johnson',
      clientAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      time: '10:00 AM - 11:30 AM',
      date: '2024-01-23',
      type: 'Client Meeting',
      caseNumber: 'CASE-2024-001',
      location: 'Conference Room A',
      meetingType: 'In-Person',
      status: 'Confirmed',
      priority: 'High',
      description: 'Review employment contract terms and negotiate non-compete clauses',
      attendees: ['Sarah Johnson', 'Legal Team'],
      documents: ['Employment_Contract_v3.pdf', 'Legal_Analysis.pdf'],
      reminders: ['1 hour before', '15 minutes before'],
      billableHours: 1.5,
      hourlyRate: 450
    },
    {
      id: 2,
      title: 'Startup Legal Consultation',
      client: 'Michael Chen',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      time: '2:00 PM - 3:00 PM',
      date: '2024-01-23',
      type: 'Video Consultation',
      caseNumber: 'CASE-2024-002',
      location: 'Virtual',
      meetingType: 'Video Call',
      status: 'Confirmed',
      priority: 'Medium',
      description: 'Discuss investment agreement structure and corporate governance',
      attendees: ['Michael Chen', 'Investment Team'],
      documents: ['Investment_Terms.pdf', 'Corporate_Structure.pdf'],
      reminders: ['30 minutes before'],
      billableHours: 1,
      hourlyRate: 450
    },
    {
      id: 3,
      title: 'Court Hearing Preparation',
      client: 'Emily Rodriguez',
      clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      time: '4:00 PM - 6:00 PM',
      date: '2024-01-23',
      type: 'Internal Meeting',
      caseNumber: 'CASE-2024-003',
      location: 'Law Library',
      meetingType: 'In-Person',
      status: 'Confirmed',
      priority: 'High',
      description: 'Prepare arguments and review evidence for environmental compliance hearing',
      attendees: ['Legal Team', 'Expert Witness'],
      documents: ['Environmental_Report.pdf', 'Compliance_Records.pdf'],
      reminders: ['2 hours before', '30 minutes before'],
      billableHours: 2,
      hourlyRate: 450
    },
    {
      id: 4,
      title: 'Deposition Scheduling',
      client: 'David Thompson',
      clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      time: '10:30 AM - 11:30 AM',
      date: '2024-01-24',
      type: 'Planning Session',
      caseNumber: 'CASE-2024-004',
      location: 'Office',
      meetingType: 'Phone Call',
      status: 'Tentative',
      priority: 'Medium',
      description: 'Schedule depositions for property acquisition case witnesses',
      attendees: ['David Thompson', 'Opposing Counsel'],
      documents: ['Witness_List.pdf'],
      reminders: ['1 hour before'],
      billableHours: 1,
      hourlyRate: 450
    }
  ];

  // Court dates and deadlines
  const legalDeadlines = [
    { 
      id: 1,
      date: '2024-01-25', 
      event: 'Motion Filing Deadline', 
      time: '5:00 PM',
      case: 'CASE-2024-001',
      type: 'Filing Deadline',
      priority: 'Critical'
    },
    { 
      id: 2,
      date: '2024-01-26', 
      event: 'Discovery Response Due', 
      time: '11:59 PM',
      case: 'CASE-2024-003',
      type: 'Discovery',
      priority: 'High'
    },
    { 
      id: 3,
      date: '2024-01-28', 
      event: 'Court Hearing - Environmental Compliance', 
      time: '9:00 AM',
      case: 'CASE-2024-003',
      type: 'Court Hearing',
      priority: 'Critical'
    }
  ];

  // Calendar integration data
  const calendarIntegrations = [
    { name: 'Google Calendar', status: 'Connected', lastSync: '2 minutes ago', color: '#4285f4' },
    { name: 'Outlook Calendar', status: 'Connected', lastSync: '5 minutes ago', color: '#0078d4' },
    { name: 'Apple Calendar', status: 'Disconnected', lastSync: 'Never', color: '#000000' }
  ];

  // Time slots for quick booking
  const availableSlots = [
    { time: '9:00 AM', available: true },
    { time: '9:30 AM', available: false },
    { time: '10:00 AM', available: false },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '11:30 AM', available: false },
    { time: '1:00 PM', available: true },
    { time: '1:30 PM', available: true },
    { time: '2:00 PM', available: false },
    { time: '2:30 PM', available: true },
    { time: '3:00 PM', available: true },
    { time: '3:30 PM', available: true },
    { time: '4:00 PM', available: false },
    { time: '4:30 PM', available: true }
  ];

  const todaysAppointments = appointments.filter(apt => apt.date === selectedDate);
  const selectedAppointmentData = selectedAppointment ? appointments.find(apt => apt.id === selectedAppointment) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge className="mb-4 bg-legal-navy text-white">
              📅 Live Smart Scheduling
            </Badge>
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Intelligent Calendar Management
            </h1>
            <p className="text-xl text-gray-600">
              Experience Judicature's AI-powered scheduling with calendar integration, automated booking, and legal deadline tracking.
            </p>
          </div>

          {/* Scheduling Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-legal-navy">18</p>
                    <p className="text-xs text-green-600 mt-1">↑ 12% vs last week</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Billable Hours</p>
                    <p className="text-2xl font-bold text-legal-navy">42.5</p>
                    <p className="text-xs text-blue-600 mt-1">$19,125 revenue</p>
                  </div>
                  <Clock className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Efficiency</p>
                    <p className="text-2xl font-bold text-legal-navy">94%</p>
                    <p className="text-xs text-green-600 mt-1">AI optimization</p>
                  </div>
                  <Zap className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Deadlines</p>
                    <p className="text-2xl font-bold text-legal-navy">3</p>
                    <p className="text-xs text-red-600 mt-1">Critical upcoming</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="calendar" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="appointments">Meetings</TabsTrigger>
                <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button className="bg-legal-navy hover:bg-legal-navy/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            </div>

            <TabsContent value="calendar" className="space-y-6">
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Calendar View */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CardTitle className="flex items-center gap-2">
                          Calendar View
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(currentWeek - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">January 22-28, 2024</span>
                          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(currentWeek + 1)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={viewMode === 'day' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('day')}
                        >
                          Day
                        </Button>
                        <Button
                          variant={viewMode === 'week' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('week')}
                        >
                          Week
                        </Button>
                        <Button
                          variant={viewMode === 'month' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('month')}
                        >
                          Month
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                      {/* Header */}
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="bg-gray-100 p-3 text-center text-sm font-medium">
                          {day}
                        </div>
                      ))}
                      
                      {/* Calendar Days */}
                      {Array.from({ length: 35 }, (_, i) => {
                        const dayNumber = i - 7 + 22; // Starting from Jan 22
                        const isCurrentDay = dayNumber === 23;
                        const hasAppointment = dayNumber === 23 || dayNumber === 24;
                        
                        return (
                          <div
                            key={i}
                            className={`bg-white p-3 min-h-24 cursor-pointer transition-colors hover:bg-gray-50 ${
                              isCurrentDay ? 'bg-legal-navy/10 border-2 border-legal-navy' : ''
                            }`}
                            onClick={() => setSelectedDate(`2024-01-${dayNumber.toString().padStart(2, '0')}`)}
                          >
                            <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-legal-navy' : ''}`}>
                              {dayNumber > 0 && dayNumber <= 31 ? dayNumber : ''}
                            </div>
                            {hasAppointment && (
                              <div className="space-y-1">
                                {dayNumber === 23 && (
                                  <div className="bg-legal-navy text-white text-xs p-1 rounded truncate">
                                    Contract Review
                                  </div>
                                )}
                                {dayNumber === 24 && (
                                  <div className="bg-blue-500 text-white text-xs p-1 rounded truncate">
                                    Deposition Prep
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Schedule Sidebar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Schedule</CardTitle>
                    <CardDescription>Tuesday, January 23, 2024</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {todaysAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedAppointment(appointment.id)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img 
                            src={appointment.clientAvatar} 
                            alt={appointment.client}
                            className="w-6 h-6 rounded-full"
                          />
                          <Badge variant={
                            appointment.priority === 'High' ? 'destructive' : 
                            appointment.priority === 'Medium' ? 'default' : 
                            'secondary'
                          } className="text-xs">
                            {appointment.priority}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{appointment.title}</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {appointment.time}
                          </div>
                          <div className="flex items-center gap-1">
                            {appointment.meetingType === 'Video Call' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            {appointment.location}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Available Time Slots */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">Available Slots</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {availableSlots.slice(0, 8).map((slot) => (
                          <Button
                            key={slot.time}
                            variant={slot.available ? 'outline' : 'ghost'}
                            size="sm"
                            className={`text-xs ${
                              slot.available 
                                ? 'hover:bg-legal-navy hover:text-white' 
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                            disabled={!slot.available}
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Selected Appointment Details */}
              {selectedAppointmentData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <img 
                          src={selectedAppointmentData.clientAvatar} 
                          alt={selectedAppointmentData.client}
                          className="w-8 h-8 rounded-full"
                        />
                        {selectedAppointmentData.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button variant="outline" size="sm">Cancel</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Meeting Details</Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {selectedAppointmentData.time} on {selectedAppointmentData.date}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {selectedAppointmentData.meetingType === 'Video Call' ? 
                                <Video className="h-4 w-4 text-gray-400" /> : 
                                <MapPin className="h-4 w-4 text-gray-400" />
                              }
                              {selectedAppointmentData.location}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-gray-400" />
                              Case: {selectedAppointmentData.caseNumber}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Billing Information</Label>
                          <div className="mt-2 space-y-1 text-sm">
                            <div>Billable Hours: {selectedAppointmentData.billableHours}h</div>
                            <div>Rate: ${selectedAppointmentData.hourlyRate}/hour</div>
                            <div className="font-medium">Total: ${(selectedAppointmentData.billableHours * selectedAppointmentData.hourlyRate).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Attendees</Label>
                          <div className="mt-2 space-y-1">
                            {selectedAppointmentData.attendees.map((attendee, index) => (
                              <div key={index} className="text-sm flex items-center gap-2">
                                <Users className="h-3 w-3 text-gray-400" />
                                {attendee}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Documents</Label>
                          <div className="mt-2 space-y-1">
                            {selectedAppointmentData.documents.map((doc, index) => (
                              <div key={index} className="text-sm flex items-center gap-2">
                                <FileText className="h-3 w-3 text-gray-400" />
                                {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Description</Label>
                          <p className="mt-2 text-sm text-gray-600">
                            {selectedAppointmentData.description}
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Reminders</Label>
                          <div className="mt-2 space-y-1">
                            {selectedAppointmentData.reminders.map((reminder, index) => (
                              <div key={index} className="text-sm flex items-center gap-2">
                                <Bell className="h-3 w-3 text-gray-400" />
                                {reminder}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4">
              <div className="grid gap-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={appointment.clientAvatar} 
                            alt={appointment.client}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{appointment.title}</h3>
                              <Badge variant={appointment.status === 'Confirmed' ? 'default' : 'secondary'}>
                                {appointment.status}
                              </Badge>
                              <Badge variant={
                                appointment.priority === 'High' ? 'destructive' : 
                                appointment.priority === 'Medium' ? 'default' : 
                                'secondary'
                              }>
                                {appointment.priority}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{appointment.description}</p>
                            
                            <div className="grid md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{appointment.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {appointment.meetingType === 'Video Call' ? 
                                  <Video className="h-4 w-4 text-gray-400" /> : 
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                }
                                <span>{appointment.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span>{appointment.caseNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BarChart className="h-4 w-4 text-gray-400" />
                                <span>{appointment.billableHours}h billable</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            {appointment.meetingType === 'Video Call' ? <Video className="h-4 w-4 mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
                            Join
                          </Button>
                          <Button size="sm" variant="outline">Reschedule</Button>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="deadlines" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Critical Legal Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {legalDeadlines.map((deadline) => (
                        <div key={deadline.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              deadline.priority === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              {deadline.type === 'Court Hearing' ? <CalendarIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                            </div>
                            <div>
                              <h4 className="font-semibold">{deadline.event}</h4>
                              <p className="text-sm text-gray-600">{deadline.case} • {deadline.type}</p>
                              <p className="text-sm text-gray-500">{deadline.date} at {deadline.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={deadline.priority === 'Critical' ? 'destructive' : 'default'}>
                              {deadline.priority}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Bell className="h-4 w-4 mr-2" />
                              Set Reminder
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar Integrations</CardTitle>
                  <CardDescription>
                    Sync your Judicature schedule with external calendar applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {calendarIntegrations.map((integration, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: integration.color }}
                          ></div>
                          <div>
                            <h4 className="font-medium">{integration.name}</h4>
                            <p className="text-sm text-gray-600">Last sync: {integration.lastSync}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={integration.status === 'Connected' ? 'default' : 'secondary'}>
                            {integration.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-legal-navy/10 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Zap className="h-5 w-5 text-legal-navy mt-1" />
                      <div>
                        <h4 className="font-medium text-legal-navy">AI-Powered Smart Scheduling</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Our AI automatically optimizes your schedule, prevents double-bookings, and suggests optimal meeting times based on your preferences and case priorities.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Scheduling;
