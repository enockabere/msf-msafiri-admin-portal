"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Plane, Car, MapPin, Clock, Users, RefreshCw, Calendar, Building, Hotel } from "lucide-react";

interface FlightTicket {
  id: string;
  participant_name: string;
  participant_email: string;
  event_title: string;
  departure_country: string;
  departure_city: string;
  departure_airport: string;
  arrival_airport: string;
  flight_number: string;
  airline: string;
  departure_time: string;
  arrival_time: string;
  seat_number: string;
  booking_reference: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface TransportBooking {
  id: string;
  participant_name: string;
  participant_email: string;
  event_title: string;
  pickup_location: string;
  destination: string;
  destination_type: 'guesthouse' | 'vendor_hotel';
  pickup_time: string;
  driver_name: string;
  driver_phone: string;
  vehicle_type: string;
  vehicle_number: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  flight_number?: string;
  created_at: string;
}

export default function TransportPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [flightTickets, setFlightTickets] = useState<FlightTicket[]>([]);
  const [transportBookings, setTransportBookings] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const generateDummyFlightTickets = useCallback(() => {
    const airlines = ['Kenya Airways', 'Ethiopian Airlines', 'Turkish Airlines', 'Emirates', 'Qatar Airways'];
    const airports = {
      'Kenya': { city: 'Nairobi', code: 'NBO' },
      'Uganda': { city: 'Kampala', code: 'EBB' },
      'Tanzania': { city: 'Dar es Salaam', code: 'DAR' },
      'Ethiopia': { city: 'Addis Ababa', code: 'ADD' },
      'South Sudan': { city: 'Juba', code: 'JUB' },
      'Somalia': { city: 'Mogadishu', code: 'MGQ' }
    };
    
    const dummyTickets: FlightTicket[] = [
      {
        id: '1',
        participant_name: 'John Doe',
        participant_email: 'john.doe@msf.org',
        event_title: 'MSF Regional Logistics Workshop',
        departure_country: 'Uganda',
        departure_city: 'Kampala',
        departure_airport: 'EBB',
        arrival_airport: 'NBO',
        flight_number: 'KQ412',
        airline: 'Kenya Airways',
        departure_time: '2024-11-15T08:30:00',
        arrival_time: '2024-11-15T10:45:00',
        seat_number: '12A',
        booking_reference: 'MSF001',
        status: 'confirmed'
      },
      {
        id: '2',
        participant_name: 'Sarah Wilson',
        participant_email: 'sarah.wilson@msf.org',
        event_title: 'Emergency Response Training',
        departure_country: 'Ethiopia',
        departure_city: 'Addis Ababa',
        departure_airport: 'ADD',
        arrival_airport: 'NBO',
        flight_number: 'ET305',
        airline: 'Ethiopian Airlines',
        departure_time: '2024-11-16T14:20:00',
        arrival_time: '2024-11-16T16:35:00',
        seat_number: '8C',
        booking_reference: 'MSF002',
        status: 'confirmed'
      },
      {
        id: '3',
        participant_name: 'Ahmed Hassan',
        participant_email: 'ahmed.hassan@msf.org',
        event_title: 'Medical Supply Chain Conference',
        departure_country: 'Somalia',
        departure_city: 'Mogadishu',
        departure_airport: 'MGQ',
        arrival_airport: 'NBO',
        flight_number: 'TK672',
        airline: 'Turkish Airlines',
        departure_time: '2024-11-17T11:15:00',
        arrival_time: '2024-11-17T13:30:00',
        seat_number: '15F',
        booking_reference: 'MSF003',
        status: 'confirmed'
      }
    ];
    
    return dummyTickets;
  }, []);

  const generateTransportBookings = useCallback((tickets: FlightTicket[]) => {
    const accommodations = [
      { name: 'Tanga Heights Guest House', type: 'guesthouse' as const, address: 'Tanga Heights, Nairobi' },
      { name: 'Sarova Stanley Hotel', type: 'vendor_hotel' as const, address: 'Kimathi Street, Nairobi' },
      { name: 'MSF Guest House Westlands', type: 'guesthouse' as const, address: 'Westlands, Nairobi' }
    ];
    
    const drivers = [
      { name: 'Peter Kamau', phone: '+254712345678' },
      { name: 'Mary Wanjiku', phone: '+254723456789' },
      { name: 'David Ochieng', phone: '+254734567890' }
    ];
    
    const vehicles = [
      { type: 'Toyota Hiace', number: 'KCA 123A' },
      { type: 'Nissan X-Trail', number: 'KCB 456B' },
      { type: 'Toyota Prado', number: 'KCC 789C' }
    ];
    
    return tickets.map((ticket, index) => {
      const accommodation = accommodations[index % accommodations.length];
      const driver = drivers[index % drivers.length];
      const vehicle = vehicles[index % vehicles.length];
      const arrivalTime = new Date(ticket.arrival_time);
      const pickupTime = new Date(arrivalTime.getTime() + 60 * 60 * 1000); // 1 hour after arrival
      
      return {
        id: `TB${index + 1}`,
        participant_name: ticket.participant_name,
        participant_email: ticket.participant_email,
        event_title: ticket.event_title,
        pickup_location: 'Jomo Kenyatta International Airport (JKIA)',
        destination: accommodation.name,
        destination_type: accommodation.type,
        pickup_time: pickupTime.toISOString(),
        driver_name: driver.name,
        driver_phone: driver.phone,
        vehicle_type: vehicle.type,
        vehicle_number: vehicle.number,
        status: 'scheduled' as const,
        flight_number: ticket.flight_number,
        created_at: new Date().toISOString()
      };
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      setLoading(true);
      // Generate dummy data
      const tickets = generateDummyFlightTickets();
      const bookings = generateTransportBookings(tickets);
      
      setFlightTickets(tickets);
      setTransportBookings(bookings);
    } catch (error) {
      console.error("Error generating transport data:", error);
      toast({ title: "Error", description: "Failed to load transport data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, generateDummyFlightTickets, generateTransportBookings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateBookings = async () => {
    setGenerating(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchData();
      toast({ title: "Success", description: "Transport bookings generated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate bookings", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const getFlightStats = () => {
    return {
      total: flightTickets.length,
      confirmed: flightTickets.filter(t => t.status === 'confirmed').length,
      pending: flightTickets.filter(t => t.status === 'pending').length,
      today: flightTickets.filter(t => {
        const arrivalDate = new Date(t.arrival_time).toDateString();
        const today = new Date().toDateString();
        return arrivalDate === today;
      }).length
    };
  };

  const getTransportStats = () => {
    return {
      total: transportBookings.length,
      scheduled: transportBookings.filter(b => b.status === 'scheduled').length,
      in_progress: transportBookings.filter(b => b.status === 'in_progress').length,
      completed: transportBookings.filter(b => b.status === 'completed').length
    };
  };

  const flightStats = getFlightStats();
  const transportStats = getTransportStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="text-sm font-medium text-gray-600">Loading transport data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Travel & Transport Management</h1>
              <p className="text-sm text-gray-600">Manage flight tickets and automatic transport bookings for international visitors</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleGenerateBookings}
                disabled={generating}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Flight Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{flightStats.total}</p>
                  <p className="text-xs text-gray-500">{flightStats.confirmed} confirmed</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Transport Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{transportStats.total}</p>
                  <p className="text-xs text-gray-500">{transportStats.scheduled} scheduled</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Arrivals Today</p>
                  <p className="text-2xl font-bold text-gray-900">{flightStats.today}</p>
                  <p className="text-xs text-gray-500">International visitors</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Transfers</p>
                  <p className="text-2xl font-bold text-gray-900">{transportStats.in_progress}</p>
                  <p className="text-xs text-gray-500">In progress</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flight Tickets Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600" />
              Flight Tickets - International Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flightTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{ticket.participant_name}</h3>
                        <Badge variant={ticket.status === 'confirmed' ? 'default' : 'secondary'}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{ticket.event_title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {ticket.departure_city} ({ticket.departure_airport}) → NBO
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(ticket.arrival_time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-blue-600">{ticket.flight_number}</div>
                      <div className="text-sm text-gray-500">{ticket.airline}</div>
                      <div className="text-xs text-gray-400">Seat {ticket.seat_number}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transport Bookings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-green-600" />
              Automatic Transport Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transportBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{booking.participant_name}</h3>
                        <Badge 
                          variant={booking.status === 'completed' ? 'default' : 
                                 booking.status === 'in_progress' ? 'secondary' : 'outline'}
                          className={booking.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : ''}
                        >
                          {booking.status.replace('_', ' ')}
                        </Badge>
                        {booking.destination_type === 'guesthouse' ? (
                          <Building className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Hotel className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{booking.event_title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.pickup_location} → {booking.destination}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(booking.pickup_time).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>Flight: {booking.flight_number}</span>
                        <span>Driver: {booking.driver_name}</span>
                        <span>Vehicle: {booking.vehicle_type} ({booking.vehicle_number})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{booking.destination_type === 'guesthouse' ? 'Guest House' : 'Hotel'}</div>
                      <div className="text-xs text-gray-500">{booking.driver_phone}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}