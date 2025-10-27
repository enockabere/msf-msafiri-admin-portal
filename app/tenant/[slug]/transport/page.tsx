"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Plane, Car, MapPin, Clock, Users, RefreshCw, Calendar, Building, Hotel, CheckCircle } from "lucide-react";
import FlightDetailsModal from "@/components/transport/FlightDetailsModal";

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
  const [selectedBooking, setSelectedBooking] = useState<TransportBooking | null>(null);
  const [showFlightModal, setShowFlightModal] = useState(false);

  const fetchInternationalVisitors = useCallback(async () => {
    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/confirmed-guests?tenant_context=${tenantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Filter for international visitors only
        const internationalGuests = data.guests?.filter((guest: any) => 
          guest.travelling_from_country && guest.travelling_from_country !== 'Kenya'
        ) || [];
        
        return internationalGuests;
      }
      return [];
    } catch (error) {
      console.error('Error fetching international visitors:', error);
      return [];
    }
  }, [apiClient, tenantSlug]);

  const generateFlightTickets = useCallback((visitors: any[]) => {
    const airlines = ['Kenya Airways', 'Ethiopian Airlines', 'Turkish Airlines', 'Emirates', 'Qatar Airways'];
    const airports: Record<string, { city: string; code: string }> = {
      'Uganda': { city: 'Kampala', code: 'EBB' },
      'Tanzania': { city: 'Dar es Salaam', code: 'DAR' },
      'Ethiopia': { city: 'Addis Ababa', code: 'ADD' },
      'South Sudan': { city: 'Juba', code: 'JUB' },
      'Somalia': { city: 'Mogadishu', code: 'MGQ' }
    };
    
    return visitors.map((visitor, index) => {
      const country = visitor.travelling_from_country || 'Uganda';
      const airport = airports[country] || airports['Uganda'];
      const airline = airlines[index % airlines.length];
      const flightNumber = `${airline.split(' ')[0].substring(0, 2).toUpperCase()}${(index + 1) * 100 + 12}`;
      
      // Generate arrival time (next few days)
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + (index % 7) + 1);
      arrivalDate.setHours(8 + (index * 3) % 12, 30 + (index * 15) % 60);
      
      const departureDate = new Date(arrivalDate.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
      
      return {
        id: `FT${index + 1}`,
        participant_name: visitor.name,
        participant_email: visitor.email,
        event_title: visitor.event,
        departure_country: country,
        departure_city: airport.city,
        departure_airport: airport.code,
        arrival_airport: 'NBO',
        flight_number: flightNumber,
        airline: airline,
        departure_time: departureDate.toISOString(),
        arrival_time: arrivalDate.toISOString(),
        seat_number: `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
        booking_reference: `MSF${String(index + 1).padStart(3, '0')}`,
        status: 'confirmed' as const
      };
    });
  }, []);

  const fetchTransportBookings = useCallback(async () => {
    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/pending-bookings?tenant_context=${tenantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const bookings = await response.json();
        return bookings.map((booking: any) => ({
          id: booking.id.toString(),
          participant_name: booking.participants[0]?.name || 'Unknown',
          participant_email: booking.participants[0]?.email || '',
          event_title: booking.participants[0]?.event || 'Unknown Event',
          pickup_location: booking.pickup_locations[0] || 'JKIA Airport',
          destination: booking.destination,
          destination_type: booking.destination.toLowerCase().includes('guest') ? 'guesthouse' as const : 'vendor_hotel' as const,
          pickup_time: booking.scheduled_time,
          driver_name: 'Absolute Cabs Driver',
          driver_phone: '+254700000000',
          vehicle_type: 'SUV',
          vehicle_number: 'Pending Assignment',
          status: 'scheduled' as const,
          flight_number: booking.flight_number || 'TBD',
          created_at: booking.created_at
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching transport bookings:', error);
      return [];
    }
  }, [apiClient, tenantSlug]);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      setLoading(true);
      
      // Fetch international visitors and generate flight tickets
      const visitors = await fetchInternationalVisitors();
      const tickets = generateFlightTickets(visitors);
      
      // Fetch real transport bookings from API
      const bookings = await fetchTransportBookings();
      
      setFlightTickets(tickets);
      setTransportBookings(bookings);
    } catch (error) {
      console.error("Error loading transport data:", error);
      toast({ title: "Error", description: "Failed to load transport data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, fetchInternationalVisitors, generateFlightTickets, fetchTransportBookings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createAbsoluteCabsBooking = async (flightTicket: FlightTicket, destination: string) => {
    try {
      const token = apiClient.getToken();
      
      // Calculate pickup time (1 hour after flight arrival)
      const arrivalTime = new Date(flightTicket.arrival_time);
      const pickupTime = new Date(arrivalTime.getTime() + 60 * 60 * 1000);
      
      const bookingData = {
        pickup_address: "JKIA Airport",
        pickup_latitude: -1.319167,
        pickup_longitude: 36.927778,
        dropoff_address: destination,
        dropoff_latitude: -1.286389, // Nairobi center coordinates
        dropoff_longitude: 36.817223,
        pickup_time: pickupTime.toISOString().slice(0, 19), // Format: "2025-10-25T15:00:00"
        passenger_name: flightTicket.participant_name,
        passenger_phone: "254712345678", // Default phone
        passenger_email: flightTicket.participant_email,
        vehicle_type: "SUV",
        flight_details: flightTicket.flight_number,
        notes: `MSF visitor pickup for ${flightTicket.event_title}. Flight ${flightTicket.flight_number} from ${flightTicket.departure_city}.`
      };
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/create-absolute-booking`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify(bookingData)
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          booking_reference: result.booking_reference,
          passenger: flightTicket.participant_name
        };
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        passenger: flightTicket.participant_name
      };
    }
  };

  const handleGenerateBookings = async () => {
    setGenerating(true);
    try {
      const accommodations = [
        'Tanga Heights Guest House, Nairobi',
        'Sarova Stanley Hotel, Kimathi Street',
        'MSF Guest House Westlands, Nairobi',
        'Hilton Nairobi, Mama Ngina Street',
        'Serena Hotel, Kenyatta Avenue'
      ];
      
      const results = [];
      
      // Create Absolute Cabs bookings for each flight ticket
      for (let i = 0; i < flightTickets.length; i++) {
        const ticket = flightTickets[i];
        const destination = accommodations[i % accommodations.length];
        
        const result = await createAbsoluteCabsBooking(ticket, destination);
        results.push(result);
        
        // Add delay between requests to avoid rate limiting
        if (i < flightTickets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast({ 
          title: "Bookings Created", 
          description: `${successCount} transport bookings sent to Absolute Cabs${failureCount > 0 ? `, ${failureCount} failed` : ''}` 
        });
      }
      
      if (failureCount > 0) {
        const failedPassengers = results.filter(r => !r.success).map(r => r.passenger).join(', ');
        toast({ 
          title: "Some Bookings Failed", 
          description: `Failed to create bookings for: ${failedPassengers}`,
          variant: "destructive"
        });
      }
      
      // Update transport bookings to show created bookings
      const newBookings = results
        .filter(r => r.success)
        .map((result, index) => {
          const ticket = flightTickets[index];
          const destination = accommodations[index % accommodations.length];
          const arrivalTime = new Date(ticket.arrival_time);
          const pickupTime = new Date(arrivalTime.getTime() + 60 * 60 * 1000);
          
          return {
            id: `AB${index + 1}`,
            participant_name: ticket.participant_name,
            participant_email: ticket.participant_email,
            event_title: ticket.event_title,
            pickup_location: 'JKIA Airport',
            destination: destination,
            destination_type: destination.toLowerCase().includes('guest') ? 'guesthouse' as const : 'vendor_hotel' as const,
            pickup_time: pickupTime.toISOString(),
            driver_name: 'Absolute Cabs Driver',
            driver_phone: '+254700000000',
            vehicle_type: 'SUV',
            vehicle_number: 'Assigned by Absolute Cabs',
            status: 'completed' as const,
            flight_number: ticket.flight_number,
            created_at: new Date().toISOString()
          };
        });
      
      setTransportBookings(prev => [...prev, ...newBookings]);
      
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
                    Generate Bookings
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
                    <div className="text-right space-y-2">
                      <div className="text-sm font-medium text-gray-900">{booking.destination_type === 'guesthouse' ? 'Guest House' : 'Hotel'}</div>
                      <div className="text-xs text-gray-500">{booking.driver_phone}</div>
                      {booking.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowFlightModal(true);
                          }}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs px-3 py-1"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Update Details
                        </Button>
                      )}
                      {booking.status === 'completed' && (
                        <div className="text-xs text-green-600 font-medium">✓ Booked with Absolute Cabs</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Flight Details Modal */}
        <FlightDetailsModal
          open={showFlightModal}
          onOpenChange={setShowFlightModal}
          booking={selectedBooking}
          onSuccess={() => {
            fetchData();
            setSelectedBooking(null);
          }}
          apiClient={apiClient}
          tenantSlug={tenantSlug}
        />
      </div>
    </DashboardLayout>
  );
}