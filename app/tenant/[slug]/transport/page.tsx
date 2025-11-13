"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Car, MapPin, Users, RefreshCw, Calendar, CheckCircle, AlertCircle, Settings, Search, User, Combine, Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TransportRequest {
  id: number;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  pickup_time: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email?: string;
  vehicle_type?: string;
  flight_details?: string;
  notes?: string;
  event_id: number;
  flight_itinerary_id?: number;
  user_email: string;
  status: string;
  booking_reference?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_number?: string;
  vehicle_color?: string;
  created_at: string;
  updated_at: string;
  event?: {
    id: number;
    title: string;
    tenant_id: number;
  };
}

interface TransportProvider {
  id: number;
  provider_name: string;
  is_enabled: boolean;
  client_id: string;
  client_secret: string;
  hmac_secret: string;
  api_base_url: string;
  token_url: string;
}

interface TenantResponse {
  id: number;
  name: string;
  slug: string;
}

interface VehicleTypesResponse {
  vehicle_types: any[];
}

interface PoolingSuggestionsResponse {
  suggestions: any[];
}

export default function TransportPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TransportRequest[]>([]);
  const [transportProvider, setTransportProvider] = useState<TransportProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState<number | null>(null);
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [manualBookingData, setManualBookingData] = useState({
    driverName: '',
    driverPhone: '',
    vehicleType: 'SUV'
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showPoolingModal, setShowPoolingModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [poolingSuggestions, setPoolingSuggestions] = useState<any[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [bulkVehicleType, setBulkVehicleType] = useState('');
  const [confirmationData, setConfirmationData] = useState({
    driverName: '',
    driverPhone: '',
    vehicleType: 'SUV',
    vehicleColor: '',
    numberPlate: ''
  });
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);
  const [requestPoolingSuggestions, setRequestPoolingSuggestions] = useState<any[]>([]);
  const [loadingPoolingSuggestions, setLoadingPoolingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchTransportRequests = useCallback(async () => {
    try {
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`) as TenantResponse;
      const tenantId = tenantResponse.id;
      
      const response = await apiClient.request(`/transport-requests/tenant/${tenantId}`) as TransportRequest[];
      return response || [];
    } catch (error) {
      console.error('Error fetching transport requests:', error);
      return [];
    }
  }, [apiClient, tenantSlug]);

  const fetchTransportProvider = useCallback(async () => {
    try {
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`) as TenantResponse;
      const tenantId = tenantResponse.id;
      
      const response = await apiClient.request(`/transport-providers/tenant/${tenantId}/provider/absolute_cabs`) as TransportProvider;
      return response;
    } catch (error: any) {
      // Suppress 404 errors - expected when provider not configured
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        return null;
      }
      console.error('Error fetching transport provider:', error);
      return null;
    }
  }, [apiClient, tenantSlug]);

  const fetchVehicleTypes = useCallback(async () => {
    try {
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`) as TenantResponse;
      const tenantId = tenantResponse.id;
      
      const response = await apiClient.request(`/transport-requests/tenant/${tenantId}/vehicle-types`) as VehicleTypesResponse;
      return response.vehicle_types || [];
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      return [];
    }
  }, [apiClient, tenantSlug]);

  const fetchPoolingSuggestions = useCallback(async () => {
    try {
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`) as TenantResponse;
      const tenantId = tenantResponse.id;
      
      const response = await apiClient.request(`/transport-requests/tenant/${tenantId}/pooling-suggestions`) as PoolingSuggestionsResponse;
      const suggestions = response.suggestions || [];
      
      return suggestions;
    } catch (error: any) {
      // Suppress geopy module errors - pooling suggestions are optional
      if (error?.message?.includes('geopy') || error?.message?.includes('No module named')) {
        return [];
      }
      return [];
    }
  }, [apiClient, tenantSlug]);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      setLoading(true);
      
      const [requests, provider, types] = await Promise.all([
        fetchTransportRequests(),
        fetchTransportProvider(),
        fetchVehicleTypes()
      ]);
      
      // Fetch pooling suggestions separately to avoid blocking the page
      let suggestions = [];
      try {
        suggestions = await fetchPoolingSuggestions();
      } catch (error) {
        console.warn('Pooling suggestions unavailable:', error);
      }
      
      setTransportRequests(requests);
      setTransportProvider(provider);
      setVehicleTypes(types);
      setPoolingSuggestions(suggestions);
      
    } catch (error) {
      console.error("Error loading transport data:", error);
      toast({ title: "Error", description: "Failed to load transport data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, fetchTransportRequests, fetchTransportProvider, fetchPoolingSuggestions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getFilteredRequestsByTab = (tab: string) => {
    let filtered = [...transportRequests];

    // Tab filter
    switch (tab) {
      case 'new':
        filtered = filtered.filter(r => (r.status === 'created' || r.status === 'pending') && !isPastDate(r.pickup_time));
        break;
      case 'booked':
        filtered = filtered.filter(r => r.status === 'booked' || r.status === 'confirmed');
        break;
      case 'completed':
        filtered = filtered.filter(r => r.status === 'completed');
        break;
      case 'expired':
        filtered = filtered.filter(r => (r.status === 'created' || r.status === 'pending') && isPastDate(r.pickup_time));
        break;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.flight_details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(request => request.event_id.toString() === eventFilter);
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(request => request.pickup_time.split('T')[0] === today);
    }

    return filtered;
  };

  const getPaginatedRequests = (requests: TransportRequest[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return requests.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (requests: TransportRequest[]) => {
    return Math.ceil(requests.length / itemsPerPage);
  };

  const exportToCSV = () => {
    const dataToExport = getFilteredRequestsByTab(activeTab);
    const headers = [
      'Passenger Name', 'Phone', 'Email', 'Flight Details', 'Pickup Time',
      'Pickup Address', 'Dropoff Address', 'Event', 'Status', 'Vehicle Type',
      'Booking Reference', 'Driver Name', 'Driver Phone', 'Notes'
    ];
    
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(request => [
        `"${request.passenger_name}"`,
        `"${request.passenger_phone}"`,
        `"${request.user_email}"`,
        `"${request.flight_details || 'N/A'}"`,
        `"${formatDateTime(request.pickup_time)}"`,
        `"${request.pickup_address}"`,
        `"${request.dropoff_address}"`,
        `"${request.event?.title || 'N/A'}"`,
        `"${request.status}"`,
        `"${request.vehicle_type || 'N/A'}"`,
        `"${request.booking_reference || 'N/A'}"`,
        `"${request.driver_name || 'N/A'}"`,
        `"${request.driver_phone || 'N/A'}"`,
        `"${request.notes || 'N/A'}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transport-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createAbsoluteCabsBooking = async (request: TransportRequest) => {
    try {
      if (!transportProvider || !transportProvider.is_enabled) {
        throw new Error('Transport provider not configured or disabled');
      }

      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`) as TenantResponse;
      const tenantId = tenantResponse.id;
      
      const response = await apiClient.request(
        `/transport-requests/${request.id}/book-with-absolute-cabs`,
        {
          method: 'POST',
          headers: {
            'X-Tenant-ID': tenantId.toString()
          }
        }
      ) as { booking_reference: string };
      
      return {
        success: true,
        booking_reference: response.booking_reference,
        passenger: request.passenger_name
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        passenger: request.passenger_name
      };
    }
  };

  const handleBookRequest = async (request: TransportRequest, vehicleType?: string) => {
    if (!vehicleType && transportProvider?.is_enabled) {
      // Show vehicle selection modal
      setSelectedRequest(request);
      setShowVehicleModal(true);
      return;
    }

    setBookingInProgress(request.id);
    try {
      const result = await createAbsoluteCabsBooking(request);
      
      if (result.success) {
        toast({ 
          title: "Booking Created", 
          description: `Transport booking created for ${result.passenger}` 
        });
        
        // Refresh data to show updated status
        await fetchData();
      } else {
        toast({ 
          title: "Booking Failed", 
          description: `Failed to create booking for ${result.passenger}: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create booking", variant: "destructive" });
    } finally {
      setBookingInProgress(null);
    }
  };

  const handleVehicleSelection = async () => {
    if (!selectedRequest || !selectedVehicleType) {
      toast({ title: "Error", description: "Please select a vehicle type", variant: "destructive" });
      return;
    }

    setShowVehicleModal(false);
    
    // Update the request with selected vehicle type before booking
    const updatedRequest = { ...selectedRequest, vehicle_type: selectedVehicleType };
    await handleBookRequest(updatedRequest, selectedVehicleType);
    
    setSelectedRequest(null);
    setSelectedVehicleType('');
  };

  const handlePooledBooking = async (requestIds: number[], vehicleType: string) => {
    try {
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`) as TenantResponse;
      const tenantId = tenantResponse.id;
      
      const response = await apiClient.request(
        `/transport-requests/pool-booking`,
        {
          method: 'POST',
          body: JSON.stringify({
            request_ids: requestIds,
            vehicle_type: vehicleType,
            notes: 'Pooled booking from admin portal'
          }),
          headers: {
            'X-Tenant-ID': tenantId.toString()
          }
        }
      ) as { passengers: number };
      
      toast({ 
        title: "Pooled Booking Created", 
        description: `Successfully created pooled booking for ${response.passengers} passengers` 
      });
      
      await fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create pooled booking", variant: "destructive" });
    }
  };

  const toggleRequestSelection = (requestId: number) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const fetchBookingDetails = async (refNo: string) => {
    setLoadingBookingDetails(true);
    try {
      const response = await apiClient.request(`/booking-details/${refNo}`);
      setBookingDetails(response.booking);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast({ title: "Error", description: "Failed to fetch booking details", variant: "destructive" });
    } finally {
      setLoadingBookingDetails(false);
    }
  };

  const fetchRequestPoolingSuggestions = async (requestId: number) => {
    setLoadingPoolingSuggestions(true);
    try {
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`) as TenantResponse;
      const tenantId = tenantResponse.id;
      
      const response = await apiClient.request(`/transport-requests/tenant/${tenantId}/pooling-suggestions`) as PoolingSuggestionsResponse;
      
      // Filter suggestions that include the current request
      const relevantSuggestions = response.suggestions.filter((suggestion: any) => 
        suggestion.requests.some((req: any) => req.id === requestId)
      );
      
      setRequestPoolingSuggestions(relevantSuggestions);
    } catch (error) {
      console.error('Error fetching pooling suggestions:', error);
      setRequestPoolingSuggestions([]);
    } finally {
      setLoadingPoolingSuggestions(false);
    }
  };

  const handleManualConfirmation = async () => {
    if (!selectedRequest || !confirmationData.driverName || !confirmationData.driverPhone || !confirmationData.numberPlate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setBookingInProgress(selectedRequest.id);
    try {
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`) as TenantResponse;
      const tenantId = tenantResponse.id;
      
      const response = await apiClient.request(
        `/transport-requests/${selectedRequest.id}/confirm-manual`,
        {
          method: 'POST',
          body: JSON.stringify({
            driver_name: confirmationData.driverName,
            driver_phone: confirmationData.driverPhone,
            vehicle_type: confirmationData.vehicleType,
            vehicle_color: confirmationData.vehicleColor,
            number_plate: confirmationData.numberPlate
          }),
          headers: {
            'X-Tenant-ID': tenantId.toString()
          }
        }
      ) as any;
      
      toast({ 
        title: "Request Confirmed", 
        description: `Transport request confirmed for ${selectedRequest.passenger_name}` 
      });
      
      setShowConfirmModal(false);
      setSelectedRequest(null);
      setConfirmationData({ driverName: '', driverPhone: '', vehicleType: 'SUV', vehicleColor: '', numberPlate: '' });
      
      // Refresh data to show updated status
      await fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to confirm request", variant: "destructive" });
    } finally {
      setBookingInProgress(null);
    }
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr.split('T')[0] === today;
  };

  const isPastDate = (dateStr: string) => {
    const pickupDate = new Date(dateStr);
    const now = new Date();
    return pickupDate < now;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, request?: TransportRequest) => {
    // Check if request is past date and not booked
    const isPast = request && isPastDate(request.pickup_time) && (status === 'created' || status === 'pending');
    
    const statusConfig = {
      created: { color: 'bg-gray-100 text-gray-800', label: 'Created' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      booked: { color: 'bg-blue-100 text-blue-800', label: 'Booked' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed' },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expired' }
    };
    
    const config = isPast 
      ? statusConfig.expired 
      : statusConfig[status as keyof typeof statusConfig] || statusConfig.created;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const uniqueEvents = Array.from(new Set(transportRequests.map(r => r.event?.id))).filter(Boolean);

  const getTransportStats = () => {
    return {
      total: transportRequests.length,
      new: transportRequests.filter(r => (r.status === 'pending' || r.status === 'created') && !isPastDate(r.pickup_time)).length,
      booked: transportRequests.filter(r => r.status === 'booked' || r.status === 'confirmed').length,
      completed: transportRequests.filter(r => r.status === 'completed').length,
      expired: transportRequests.filter(r => (r.status === 'pending' || r.status === 'created') && isPastDate(r.pickup_time)).length
    };
  };

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Transport Requests</h1>
              <p className="text-sm text-gray-600">Manage transport booking requests from event participants</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {transportProvider?.is_enabled && poolingSuggestions.length > 0 && (
                <Button
                  onClick={() => setShowPoolingModal(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                >
                  <Combine className="w-4 h-4 mr-2" />
                  Pool Requests ({poolingSuggestions.length})
                </Button>
              )}
              {!transportProvider?.is_enabled && (
                <Button
                  onClick={() => window.location.href = `/tenant/${tenantSlug}/transport-setup`}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Setup Transport
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Transport Provider Status */}
        {!transportProvider?.is_enabled && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Transport provider is not configured. Please set up Absolute Cabs integration to enable booking functionality.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">New Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{transportStats.new}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Booked</p>
                  <p className="text-2xl font-bold text-gray-900">{transportStats.booked}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{transportStats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Expired</p>
                  <p className="text-2xl font-bold text-gray-900">{transportStats.expired}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, flight, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {uniqueEvents.map(eventId => {
                    const event = transportRequests.find(r => r.event?.id === eventId)?.event;
                    return event ? (
                      <SelectItem key={eventId} value={eventId.toString()}>
                        {event.title}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transport Requests with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              Transport Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setCurrentPage(1); }}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="new" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New ({transportStats.new})
                </TabsTrigger>
                <TabsTrigger value="booked" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Booked ({transportStats.booked})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Completed ({transportStats.completed})
                </TabsTrigger>
                <TabsTrigger value="expired" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Expired ({transportStats.expired})
                </TabsTrigger>
              </TabsList>
              
              {['new', 'booked', 'completed', 'expired'].map(tab => {
                const tabRequests = getFilteredRequestsByTab(tab);
                const paginatedRequests = getPaginatedRequests(tabRequests);
                const totalPages = getTotalPages(tabRequests);
                
                return (
                  <TabsContent key={tab} value={tab} className="mt-6">
                    {tabRequests.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {tab.charAt(0).toUpperCase() + tab.slice(1)} Requests</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          No {tab} transport requests found.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm text-gray-600">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, tabRequests.length)} of {tabRequests.length} requests
                          </p>
                          {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <Table>
                <TableHeader>
                  <TableRow>
                    {transportProvider?.is_enabled && <TableHead className="w-12">Select</TableHead>}
                    <TableHead>Passenger</TableHead>
                    <TableHead>Flight</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                          <TableBody>
                            {paginatedRequests.map((request) => (
                    <TableRow key={request.id}>
                      {transportProvider?.is_enabled && (
                        <TableCell>
                          {(request.status === 'created' || request.status === 'pending') && !isPastDate(request.pickup_time) && (
                            <input
                              type="checkbox"
                              checked={selectedRequests.includes(request.id)}
                              onChange={() => toggleRequestSelection(request.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                          {isPastDate(request.pickup_time) && (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">
                              Past
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{request.passenger_name}</div>
                          <div className="text-sm text-muted-foreground">{request.passenger_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{request.flight_details || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(request.pickup_time)}
                          </div>
                          {isToday(request.pickup_time) && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              Today
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="truncate max-w-[200px]" title={request.pickup_address}>
                            <span className="font-medium">From:</span> {request.pickup_address}
                          </div>
                          <div className="truncate max-w-[200px]" title={request.dropoff_address}>
                            <span className="font-medium">To:</span> {request.dropoff_address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.event?.title || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status, request)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setBookingDetails(null); // Reset booking details
                              setRequestPoolingSuggestions([]); // Reset pooling suggestions
                              setShowDetailsModal(true);
                              
                              // Fetch booking details if request has booking reference
                              if (request.booking_reference && (request.status === 'booked' || request.status === 'confirmed')) {
                                fetchBookingDetails(request.booking_reference);
                              } else if (request.status === 'pending' || request.status === 'created') {
                                // Fetch pooling suggestions for pending requests
                                fetchRequestPoolingSuggestions(request.id);
                              }
                            }}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-medium transition-all duration-200"
                          >
                            {(request.status === 'booked' || request.status === 'confirmed') ? 'View Booking' : 'View'}
                          </Button>
                          {(request.status === 'created' || request.status === 'pending') && (
                            <>
                              {transportProvider?.is_enabled && (
                                <Button
                                  size="sm"
                                  onClick={() => handleBookRequest(request)}
                                  disabled={bookingInProgress === request.id || isPastDate(request.pickup_time)}
                                  className={`font-medium shadow-md hover:shadow-lg transition-all duration-200 ${
                                    isPastDate(request.pickup_time) 
                                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                                  }`}
                                  title={isPastDate(request.pickup_time) ? 'Cannot book past dates' : ''}
                                >
                                  {bookingInProgress === request.id ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                      Booking...
                                    </>
                                  ) : isPastDate(request.pickup_time) ? (
                                    'Past Date'
                                  ) : (
                                    'Book'
                                  )}
                                </Button>
                              )}
                              {!transportProvider?.is_enabled && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowConfirmModal(true);
                                  }}
                                  disabled={isPastDate(request.pickup_time)}
                                  className={`font-medium transition-all duration-200 ${
                                    isPastDate(request.pickup_time)
                                      ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300'
                                  }`}
                                  title={isPastDate(request.pickup_time) ? 'Cannot book past dates' : ''}
                                >
                                  {isPastDate(request.pickup_time) ? 'Past Date' : 'Manual Booking'}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                            </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {transportProvider?.is_enabled && selectedRequests.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Combine className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {selectedRequests.length} requests selected
                    </h3>
                    <p className="text-sm text-blue-700">
                      Create pooled booking or individual bookings
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRequests([])}
                    className="border-gray-300 text-gray-700"
                  >
                    Clear Selection
                  </Button>
                  {selectedRequests.length >= 2 && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedVehicleType}
                        onValueChange={setSelectedVehicleType}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue placeholder={selectedRequests.length > 4 ? 'Van' : 'SUV'} />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.type} className="text-xs">
                              {vehicle.type} ({vehicle.seats} seats)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => {
                          const vehicleType = selectedVehicleType || (selectedRequests.length > 4 ? 'Van' : 'SUV');
                          handlePooledBooking(selectedRequests, vehicleType);
                          setSelectedRequests([]);
                          setSelectedVehicleType('');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Combine className="w-3 h-3 mr-1" />
                        Pool Selected
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Selection Modal */}
        <Dialog open={showVehicleModal} onOpenChange={setShowVehicleModal}>
          <DialogContent className="sm:max-w-md bg-white shadow-xl">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-bold text-gray-900">Select Vehicle Type</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Choose the appropriate vehicle type for this booking
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">{selectedRequest.passenger_name}</h3>
                    <p className="text-sm text-blue-700">
                      {selectedRequest.pickup_address.slice(0, 40)}{selectedRequest.pickup_address.length > 40 ? '...' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="vehicleTypeSelect" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  Vehicle Type
                </Label>
                <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                  <SelectTrigger
                    id="vehicleTypeSelect"
                    className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <SelectValue placeholder="Select a vehicle type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-xl max-h-[300px]">
                    {vehicleTypes.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Car className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No vehicle types available</p>
                      </div>
                    ) : (
                      vehicleTypes.map((vehicle) => (
                        <SelectItem
                          key={vehicle.id}
                          value={vehicle.type}
                          className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 py-3"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                <Car className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{vehicle.type}</div>
                                <div className="text-xs text-gray-600">{vehicle.seats} seats capacity</div>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {selectedVehicleType && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Selected: {selectedVehicleType}
                        {vehicleTypes.find(v => v.type === selectedVehicleType)?.seats &&
                          ` (${vehicleTypes.find(v => v.type === selectedVehicleType)?.seats} seats)`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-200">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVehicleModal(false);
                    setSelectedVehicleType('');
                  }}
                  className="flex-1 sm:flex-initial border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVehicleSelection}
                  disabled={!selectedVehicleType}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Book with {selectedVehicleType || 'Selected Vehicle'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pooling Suggestions Modal */}
        <Dialog open={showPoolingModal} onOpenChange={setShowPoolingModal}>
          <DialogContent className="sm:max-w-2xl bg-white border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Combine className="w-5 h-5 text-green-600" />
                Pooling Suggestions
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Suggested request groupings based on time and location proximity
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {poolingSuggestions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Combine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pooling Suggestions</h3>
                  <p className="text-sm text-gray-500">
                    No compatible requests found for pooling at this time.
                  </p>
                </div>
              ) : (
                poolingSuggestions.map((suggestion) => (
                  <Card key={suggestion.group_id} className="border-green-200 bg-white shadow-sm">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-green-900">
                            {suggestion.passenger_count} passengers
                          </h4>
                          <p className="text-sm text-green-700">
                            Time window: {suggestion.time_window}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedVehicleType || suggestion.suggested_vehicle}
                            onValueChange={setSelectedVehicleType}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleTypes.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.type} className="text-xs">
                                  {vehicle.type} ({vehicle.seats} seats)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => {
                              const requestIds = suggestion.requests.map((r: any) => r.id);
                              const vehicleType = selectedVehicleType || suggestion.suggested_vehicle;
                              handlePooledBooking(requestIds, vehicleType);
                              setShowPoolingModal(false);
                              setSelectedVehicleType('');
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Combine className="w-3 h-3 mr-1" />
                            Pool
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {suggestion.requests.map((req: any) => (
                          <div key={req.id} className="text-sm bg-green-50 border border-green-100 p-3 rounded-lg">
                            <div className="font-medium text-green-900">{req.passenger_name}</div>
                            <div className="text-green-700 mt-1">
                              📍 {req.pickup_address} → {req.dropoff_address}
                            </div>
                            <div className="text-green-600 mt-1 flex items-center gap-2">
                              <span>🕒 {new Date(req.pickup_time).toLocaleTimeString()}</span>
                              <span>✈️ {req.flight_details}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <DialogFooter className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPoolingModal(false);
                  setSelectedVehicleType('');
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-lg bg-white border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {selectedRequest && (selectedRequest.status === 'booked' || selectedRequest.status === 'confirmed') 
                  ? 'Booking Details' 
                  : 'Transport Request Details'
                }
              </DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">{selectedRequest.passenger_name}</h3>
                      <p className="text-sm text-blue-700">{selectedRequest.passenger_phone}</p>
                    </div>
                    <div className="ml-auto">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Route Details
                    </Label>
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup Location</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.pickup_address}</p>
                      </div>
                      <div className="border-l-2 border-gray-300 pl-4 ml-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Dropoff Location</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.dropoff_address}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule & Flight
                    </Label>
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup Time</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedRequest.pickup_time)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Flight Details</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.flight_details || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedRequest.event && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Label className="text-sm font-semibold text-gray-700">Event</Label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{selectedRequest.event.title}</p>
                    </div>
                  )}
                  
                  {selectedRequest.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Label className="text-sm font-semibold text-gray-700">Notes</Label>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{selectedRequest.notes}</p>
                    </div>
                  )}
                  
                  {/* Booking Details Section - Priority */}
                  {(selectedRequest.status === 'booked' || selectedRequest.status === 'confirmed') && selectedRequest.booking_reference && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <Label className="text-sm font-semibold text-green-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Booking Details
                      </Label>
                      
                      {loadingBookingDetails ? (
                        <div className="mt-3 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                          <span className="text-sm text-green-700">Loading booking details...</span>
                        </div>
                      ) : bookingDetails ? (
                        <div className="mt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-green-600 uppercase tracking-wide">Reference Number</p>
                              <p className="text-sm font-medium text-green-900">{bookingDetails.ref_no}</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-600 uppercase tracking-wide">Status</p>
                              <p className="text-sm font-medium text-green-900">{bookingDetails.status}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-green-600 uppercase tracking-wide">Vehicle Type</p>
                              <p className="text-sm font-medium text-green-900">{bookingDetails.vehicle_type}</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-600 uppercase tracking-wide">Pickup Date & Time</p>
                              <p className="text-sm font-medium text-green-900">
                                {bookingDetails.pickup_date} {bookingDetails.pickup_time}
                              </p>
                            </div>
                          </div>
                          
                          {bookingDetails.drivers && bookingDetails.drivers.length > 0 && (
                            <div>
                              <p className="text-xs text-green-600 uppercase tracking-wide">Assigned Driver</p>
                              <div className="text-sm font-medium text-green-900">
                                {bookingDetails.drivers[0].name} - {bookingDetails.drivers[0].telephone}
                              </div>
                            </div>
                          )}
                          
                          {bookingDetails.vehicles && bookingDetails.vehicles.length > 0 && (
                            <div>
                              <p className="text-xs text-green-600 uppercase tracking-wide">Assigned Vehicle</p>
                              <div className="text-sm font-medium text-green-900">
                                {bookingDetails.vehicles[0].name} - {bookingDetails.vehicles[0].registration}
                              </div>
                            </div>
                          )}
                          
                          {bookingDetails.flightdetails && (
                            <div>
                              <p className="text-xs text-green-600 uppercase tracking-wide">Flight Details</p>
                              <p className="text-sm font-medium text-green-900">{bookingDetails.flightdetails}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3">
                          <p className="text-sm text-green-700">
                            Booking Reference: {selectedRequest.booking_reference}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Booking details will be available once confirmed by the transport provider.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Pooling Suggestions Section - For Pending Requests */}
                  {(selectedRequest.status === 'pending' || selectedRequest.status === 'created') && transportProvider?.is_enabled && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <Label className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                        <Combine className="w-4 h-4" />
                        Pooling Suggestions
                      </Label>
                      
                      {loadingPoolingSuggestions ? (
                        <div className="mt-3 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-blue-700">Finding pooling opportunities...</span>
                        </div>
                      ) : requestPoolingSuggestions.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {requestPoolingSuggestions.map((suggestion, index) => (
                            <div key={suggestion.group_id} className="bg-white border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="text-sm font-medium text-blue-900">
                                    Pool with {suggestion.passenger_count - 1} other passenger{suggestion.passenger_count > 2 ? 's' : ''}
                                  </h4>
                                  <p className="text-xs text-blue-700">
                                    {suggestion.suggested_vehicle} • {suggestion.time_window}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const requestIds = suggestion.requests.map((r: any) => r.id);
                                    handlePooledBooking(requestIds, suggestion.suggested_vehicle);
                                    setShowDetailsModal(false);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                                >
                                  <Combine className="w-3 h-3 mr-1" />
                                  Pool Now
                                </Button>
                              </div>
                              <div className="space-y-1">
                                {suggestion.requests
                                  .filter((req: any) => req.id !== selectedRequest.id)
                                  .map((req: any) => (
                                    <div key={req.id} className="text-xs bg-blue-100 p-2 rounded">
                                      <div className="font-medium text-blue-900">{req.passenger_name}</div>
                                      <div className="text-blue-700">
                                        {req.pickup_address.slice(0, 30)}... → {req.dropoff_address.slice(0, 30)}...
                                      </div>
                                      <div className="text-blue-600">
                                        {new Date(req.pickup_time).toLocaleTimeString()} • {req.flight_details}
                                      </div>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3">
                          <p className="text-sm text-blue-700">
                            No pooling opportunities found for this request.
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            This request can be booked individually or you can check the pooling suggestions page for other combinations.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Booking Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-bold text-gray-900">Manual Booking</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Enter vehicle and driver details to create a manual booking for this transport request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  Creating manual booking for: <strong className="text-blue-900">{selectedRequest?.passenger_name}</strong>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmDriverName" className="text-sm font-semibold text-gray-700">Driver Name *</Label>
                  <Input
                    id="confirmDriverName"
                    value={confirmationData.driverName}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, driverName: e.target.value }))}
                    placeholder="Enter driver name"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmDriverPhone" className="text-sm font-semibold text-gray-700">Driver Phone *</Label>
                  <Input
                    id="confirmDriverPhone"
                    value={confirmationData.driverPhone}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, driverPhone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNumberPlate" className="text-sm font-semibold text-gray-700">Number Plate *</Label>
                <Input
                  id="confirmNumberPlate"
                  value={confirmationData.numberPlate}
                  onChange={(e) => setConfirmationData(prev => ({ ...prev, numberPlate: e.target.value.toUpperCase() }))}
                  placeholder="Enter vehicle number plate"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono text-center"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmVehicleType" className="text-sm font-semibold text-gray-700">Vehicle Type</Label>
                  <Select
                    value={confirmationData.vehicleType}
                    onValueChange={(value) => setConfirmationData(prev => ({ ...prev, vehicleType: value }))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                      <SelectItem value="Bus">Bus</SelectItem>
                      <SelectItem value="Pickup">Pickup Truck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmVehicleColor" className="text-sm font-semibold text-gray-700">Vehicle Color</Label>
                  <Input
                    id="confirmVehicleColor"
                    value={confirmationData.vehicleColor}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                    placeholder="Enter vehicle color"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-6 border-t border-gray-200">
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedRequest(null);
                    setConfirmationData({ driverName: '', driverPhone: '', vehicleType: 'SUV', vehicleColor: '', numberPlate: '' });
                  }}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleManualConfirmation}
                  disabled={!confirmationData.driverName || !confirmationData.driverPhone || !confirmationData.numberPlate || bookingInProgress === selectedRequest?.id}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {bookingInProgress === selectedRequest?.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Manual Booking
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}