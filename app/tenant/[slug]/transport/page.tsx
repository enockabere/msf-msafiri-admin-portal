"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { Car, Calendar, Users, Package } from "lucide-react";
import TransportBookingsList from "@/components/transport/TransportBookingsList";
import CreateBookingModal from "@/components/transport/CreateBookingModal";
import AutoBookingManagement from "@/components/transport/AutoBookingManagement";

interface TransportBooking {
  id: number;
  booking_type: string;
  status: string;
  participant_ids: number[];
  pickup_locations: string[];
  destination: string;
  scheduled_time: string;
  has_welcome_package: boolean;
  package_pickup_location?: string;
  package_collected: boolean;
  vendor_type: string;
  vendor_name?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_details?: string;
  flight_number?: string;
  arrival_time?: string;
  event_title?: string;
  participants?: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
  }>;
  created_by: string;
  created_at: string;
}

interface TransportVendor {
  id: number;
  name: string;
  vendor_type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export default function TransportPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.slug as string;
  const activeTab = searchParams.get('tab') || 'bookings';

  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [vendors] = useState<TransportVendor[]>([]);
  const [, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<TransportBooking | null>(null);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      const token = apiClient.getToken();
      const bookingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/?tenant_context=${tenantSlug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error("Error fetching transport data:", error);
      toast({ title: "Error", description: "Failed to load transport data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, apiClient, tenantSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canEdit = Boolean(user?.role && ["super_admin", "mt_admin", "hr_admin"].includes(user.role));

  const getStatusCounts = () => {
    const counts = {
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      in_progress: bookings.filter(b => ['package_collected', 'visitor_picked_up', 'in_transit'].includes(b.status)).length,
      completed: bookings.filter(b => b.status === 'completed').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Transport Management</h1>
            <p className="text-sm text-gray-600">Manage transport bookings, vendors, and welcome package deliveries</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-yellow-900">{statusCounts.pending}</div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-blue-900">{statusCounts.confirmed}</div>
              <div className="text-xs text-blue-600">Confirmed</div>
            </div>
            <div className="bg-orange-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-orange-900">{statusCounts.in_progress}</div>
              <div className="text-xs text-orange-600">In Progress</div>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-green-900">{statusCounts.completed}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.set('tab', value);
          router.push(`?${newSearchParams.toString()}`, { scroll: false });
        }} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="bookings" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline">Transport Bookings</span>
              <span className="sm:hidden">Bookings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="schedule" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule View</span>
              <span className="sm:hidden">Schedule</span>
            </TabsTrigger>
            <TabsTrigger 
              value="auto-bookings" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Auto Bookings</span>
              <span className="sm:hidden">Auto</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            <TransportBookingsList 
              bookings={bookings}
              vendors={vendors}
              canEdit={canEdit}
              onRefresh={fetchData}
              onCreateBooking={() => setCreateModalOpen(true)}
              onEditBooking={(booking) => setEditingBooking(booking)}
              apiClient={apiClient as { getToken: () => string }}
              tenantSlug={tenantSlug}
            />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today&apos;s Schedule</h3>
              <div className="space-y-4">
                {bookings
                  .filter(booking => {
                    const bookingDate = new Date(booking.scheduled_time).toDateString();
                    const today = new Date().toDateString();
                    return bookingDate === today;
                  })
                  .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
                  .map(booking => (
                    <div key={booking.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          booking.status === 'completed' ? 'bg-green-500' :
                          booking.status === 'in_transit' ? 'bg-blue-500' :
                          booking.status === 'confirmed' ? 'bg-yellow-500' :
                          'bg-gray-300'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Date(booking.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {booking.has_welcome_package && (
                            <Package className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {booking.participants?.map(p => p.name).join(', ')} → {booking.destination}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.driver_name} • {booking.vehicle_details}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
                {bookings.filter(booking => {
                  const bookingDate = new Date(booking.scheduled_time).toDateString();
                  const today = new Date().toDateString();
                  return bookingDate === today;
                }).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No bookings scheduled for today</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auto-bookings" className="space-y-6">
            <AutoBookingManagement 
              canEdit={canEdit}
              onRefresh={fetchData}
              apiClient={apiClient as { getToken: () => string }}
              tenantSlug={tenantSlug}
            />
          </TabsContent>
        </Tabs>

        <CreateBookingModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          vendors={vendors}
          onSuccess={fetchData}
          apiClient={apiClient as { getToken: () => string }}
          tenantSlug={tenantSlug}
        />

        <CreateBookingModal
          open={!!editingBooking}
          onOpenChange={(open) => !open && setEditingBooking(null)}
          vendors={vendors}
          onSuccess={() => {
            fetchData();
            setEditingBooking(null);
          }}
          editingBooking={editingBooking || undefined}
          apiClient={apiClient as { getToken: () => string }}
          tenantSlug={tenantSlug}
        />
      </div>
    </DashboardLayout>
  );
}