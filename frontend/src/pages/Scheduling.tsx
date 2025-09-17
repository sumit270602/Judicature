
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Plus, MapPin } from 'lucide-react';

const Scheduling = () => {
  const [selectedDate, setSelectedDate] = useState('2024-01-20');
  
  const appointments = [
    {
      id: 1,
      title: 'Case Review with John Smith',
      client: 'John Smith',
      time: '10:00 AM - 11:00 AM',
      type: 'Consultation',
      location: 'Office',
      status: 'Confirmed'
    },
    {
      id: 2,
      title: 'Document Review',
      client: 'Sarah Johnson',
      time: '2:00 PM - 3:30 PM',
      type: 'Meeting',
      location: 'Video Call',
      status: 'Pending'
    },
    {
      id: 3,
      title: 'Settlement Discussion',
      client: 'Michael Brown',
      time: '4:00 PM - 5:00 PM',
      type: 'Negotiation',
      location: 'Client Office',
      status: 'Confirmed'
    }
  ];

  const upcomingEvents = [
    { date: '2024-01-22', event: 'Court Hearing - Smith vs. ABC Corp', time: '9:00 AM' },
    { date: '2024-01-25', event: 'Deposition - Johnson Case', time: '2:00 PM' },
    { date: '2024-01-28', event: 'Client Meeting - Brown', time: '10:30 AM' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-4 bg-legal-navy text-white">
            📅 Smart Scheduling
          </Badge>
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Smart Scheduling
          </h1>
          <p className="text-xl text-gray-600">
            Automated appointment booking, calendar integration, and reminder notifications.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar and Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-legal-navy mx-auto mb-2" />
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-sm text-gray-600">This Week</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-gray-600">Clients</div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Today's Schedule</CardTitle>
                  <Button className="bg-legal-navy hover:bg-legal-navy/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </div>
                <CardDescription>Saturday, January 20, 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                        <Badge variant={appointment.status === 'Confirmed' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {appointment.client}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.time}
                        </div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-xs">
                            {appointment.type}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {appointment.location}
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Reschedule</Button>
                        <Button size="sm" variant="outline">Cancel</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Book */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Book</CardTitle>
                <CardDescription>Schedule a new appointment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-select">Select Client</Label>
                  <Input id="client-select" placeholder="Choose client..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-date">Date</Label>
                  <Input id="appointment-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-time">Time</Label>
                  <Input id="appointment-time" type="time" />
                </div>
                <Button className="w-full bg-legal-navy hover:bg-legal-navy/90">
                  Schedule Appointment
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Important dates and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="border-l-4 border-legal-navy pl-3">
                      <div className="font-medium text-sm">{event.event}</div>
                      <div className="text-xs text-gray-600">{event.date} at {event.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Time Slots */}
            <Card>
              <CardHeader>
                <CardTitle>Available Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {['9:00 AM', '11:30 AM', '1:00 PM', '3:30 PM'].map((time) => (
                    <Button key={time} variant="outline" size="sm" className="text-xs">
                      {time}
                    </Button>
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

export default Scheduling;
