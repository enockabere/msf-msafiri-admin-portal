"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Trash2, User, Eye, Building, Hotel, Loader2, UserCheck, Filter, Download, Printer, Users, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Swal from "sweetalert2";

interface Allocation {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  accommodation_type: string;
  status: string;
  room_id?: number;
  vendor_accommodation_id?: number;
  event_id?: number;
  participant_id?: number;
  room_type?: string; // single, double - for vendor accommodations
  room?: {
    id: number;
    room_number: string;
    capacity: number;
    current_occupants: number;
    guesthouse: {
      name: string;
    };
  };
  vendor_accommodation?: {
    id: number;
    vendor_name: string;
    capacity: number;
    current_occupants: number;
    roommate_name?: string;
  };
  event?: {
    title: string;
  };
  participant?: {
    name: string;
    role: string;
    gender?: string;
  };
}

interface AllocationsListProps {
  allocations: Allocation[];
  onDelete: (id: number) => void;
  deleting: number | null;
  onCheckIn?: (id: number) => void;
  checkingIn?: number | null;
  events?: Array<{ id: number; title: string }>;
  onBulkCheckIn?: (ids: number[]) => void;
  bulkCheckingIn?: boolean;
}

type SortField = 'guest_name' | 'accommodation_type' | 'event' | 'days' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export default function AllocationsList({ allocations, onDelete, deleting, onCheckIn, checkingIn, events = [], onBulkCheckIn, bulkCheckingIn }: AllocationsListProps) {

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    occupancy: 'all',
    room: 'all',
    event: 'all',
    gender: 'all',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);



  const getAccommodationInfo = (allocation: Allocation) => {
    if (allocation.room) {
      return {
        type: "Guesthouse",
        name: allocation.room.guesthouse.name,
        room: `Room ${allocation.room.room_number}`,
        occupancy: `${allocation.room.current_occupants}/${allocation.room.capacity}`,
        shared: allocation.room.capacity > 1 && allocation.room.current_occupants > 1 ? "Yes" : "No",
        icon: Building
      };
    } else if (allocation.vendor_accommodation) {
      const roomTypeDisplay = allocation.room_type ?
        `${allocation.room_type.charAt(0).toUpperCase() + allocation.room_type.slice(1)} Room` :
        "Room";
      const sharedStatus = allocation.room_type === "double" ?
        (allocation.vendor_accommodation.roommate_name ?
          `Yes - ${allocation.vendor_accommodation.roommate_name}` : "Yes") :
        "No";
      return {
        type: "Vendor Hotel",
        name: allocation.vendor_accommodation.vendor_name,
        room: roomTypeDisplay,
        occupancy: `${allocation.vendor_accommodation.current_occupants}/${allocation.vendor_accommodation.capacity}`,
        shared: sharedStatus,
        icon: Hotel
      };
    }
    return { type: "Unknown", name: "-", room: "-", occupancy: "-", shared: "-", icon: Building };
  };

  const calculateDays = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedAllocations.map(a => a.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  const downloadCSV = () => {
    const headers = ['Guest Name', 'Occupancy', 'Room', 'Shared', 'Event', 'Days', 'Gender', 'Status'];
    const csvData = filteredAllocations.map(allocation => {
      const accommodationInfo = getAccommodationInfo(allocation);
      return [
        allocation.guest_name,
        accommodationInfo.type,
        accommodationInfo.room,
        accommodationInfo.shared,
        allocation.event?.title || '-',
        allocation.check_in_date && allocation.check_out_date ?
          `${calculateDays(allocation.check_in_date, allocation.check_out_date)} days` : '-',
        allocation.participant?.gender || '-',
        allocation.status
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-allocations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableHTML = `
      <html>
        <head>
          <title>Visitor Allocations</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Visitor Allocations Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Occupancy</th>
                <th>Room</th>
                <th>Shared</th>
                <th>Event</th>
                <th>Days</th>
                <th>Gender</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAllocations.map(allocation => {
                const accommodationInfo = getAccommodationInfo(allocation);
                return `
                  <tr>
                    <td>${allocation.guest_name}</td>
                    <td>${accommodationInfo.type}</td>
                    <td>${accommodationInfo.room}</td>
                    <td>${accommodationInfo.shared}</td>
                    <td>${allocation.event?.title || '-'}</td>
                    <td>${allocation.check_in_date && allocation.check_out_date ?
                      `${calculateDays(allocation.check_in_date, allocation.check_out_date)} days` : '-'}</td>
                    <td>${allocation.participant?.gender || '-'}</td>
                    <td>${allocation.status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      booked: "bg-blue-50 text-blue-700 border border-blue-200",
      checked_in: "bg-green-50 text-green-700 border border-green-200",
      released: "bg-gray-50 text-gray-700 border border-gray-200",
      cancelled: "bg-red-50 text-red-700 border border-red-200"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3 ml-1 text-red-600" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3 ml-1 text-red-600" />;
    return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
  };

  const filteredAllocations = useMemo(() => {
    return allocations.filter(allocation => {
      const accommodationInfo = getAccommodationInfo(allocation);

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          allocation.guest_name.toLowerCase().includes(query) ||
          allocation.guest_email.toLowerCase().includes(query) ||
          accommodationInfo.name.toLowerCase().includes(query) ||
          accommodationInfo.room.toLowerCase().includes(query) ||
          (allocation.event?.title || '').toLowerCase().includes(query) ||
          (allocation.participant?.role || '').toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Dropdown filters
      if (filters.occupancy !== 'all' && !accommodationInfo.type.toLowerCase().includes(filters.occupancy.toLowerCase())) return false;
      if (filters.room !== 'all' && !accommodationInfo.room.toLowerCase().includes(filters.room.toLowerCase())) return false;
      if (filters.event !== 'all' && allocation.event?.title !== filters.event) return false;
      if (filters.gender !== 'all' && !(allocation.participant?.gender || '').toLowerCase().includes(filters.gender.toLowerCase())) return false;
      if (filters.status !== 'all' && allocation.status !== filters.status) return false;

      return true;
    });
  }, [allocations, searchQuery, filters]);

  const sortedAllocations = useMemo(() => {
    if (!sortField || !sortDirection) return filteredAllocations;

    return [...filteredAllocations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'guest_name':
          aValue = a.guest_name.toLowerCase();
          bValue = b.guest_name.toLowerCase();
          break;
        case 'accommodation_type':
          aValue = getAccommodationInfo(a).type;
          bValue = getAccommodationInfo(b).type;
          break;
        case 'event':
          aValue = a.event?.title || '';
          bValue = b.event?.title || '';
          break;
        case 'days':
          aValue = a.check_in_date && a.check_out_date ? calculateDays(a.check_in_date, a.check_out_date) : 0;
          bValue = b.check_in_date && b.check_out_date ? calculateDays(b.check_in_date, b.check_out_date) : 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAllocations, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedAllocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAllocations = sortedAllocations.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length;

  const stats = useMemo(() => {
    return {
      total: allocations.length,
      booked: allocations.filter(a => a.status === 'booked').length,
      checkedIn: allocations.filter(a => a.status === 'checked_in').length,
      guesthouse: allocations.filter(a => a.accommodation_type === 'guesthouse').length,
      vendor: allocations.filter(a => a.accommodation_type === 'vendor').length,
    };
  }, [allocations]);

  if (allocations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-gray-500">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No visitor allocations found</h3>
            <p className="text-sm text-gray-500">Allocations will appear here once visitors are assigned to accommodations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card
          className="border-l-4 border-l-purple-500 hover:shadow-md transition-all cursor-pointer"
          onClick={() => {
            setFilters({ ...filters, status: 'all', occupancy: 'all' });
            setTimeout(() => {
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-500 uppercase tracking-wider">Total Allocations</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-blue-500 hover:shadow-md transition-all cursor-pointer"
          onClick={() => {
            setFilters({ ...filters, status: 'booked' });
            setTimeout(() => {
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-500 uppercase tracking-wider">Booked</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.booked}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-green-500 hover:shadow-md transition-all cursor-pointer"
          onClick={() => {
            setFilters({ ...filters, status: 'checked_in' });
            setTimeout(() => {
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-500 uppercase tracking-wider">Checked In</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.checkedIn}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-orange-500 hover:shadow-md transition-all cursor-pointer"
          onClick={() => {
            setFilters({ ...filters, occupancy: 'guesthouse' });
            setTimeout(() => {
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-500 uppercase tracking-wider">Guesthouses</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.guesthouse}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-teal-500 hover:shadow-md transition-all cursor-pointer"
          onClick={() => {
            setFilters({ ...filters, occupancy: 'vendor' });
            setTimeout(() => {
              document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-500 uppercase tracking-wider">Vendor Hotels</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.vendor}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Hotel className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, accommodation, room, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Toggle and Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 ${showFilters ? 'bg-red-50 border-red-200' : ''}`}
                >
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-1 bg-red-600 text-white px-1.5 py-0.5 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ occupancy: 'all', room: 'all', event: 'all', gender: 'all', status: 'all' })}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All Filters
                  </Button>
                )}
                {searchQuery && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-sm">
                    <span className="text-blue-700 font-medium">Search:</span>
                    <span className="text-blue-900">{searchQuery}</span>
                    <button onClick={() => setSearchQuery('')} className="text-blue-600 hover:text-blue-800">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2 mr-2">
                    <Badge variant="secondary" className="px-2 py-1">
                      {selectedRows.length} selected
                    </Badge>
                    {onBulkCheckIn && selectedRows.some(id => {
                      const allocation = allocations.find(a => a.id === id);
                      return allocation?.status === 'booked';
                    }) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const eligibleIds = selectedRows.filter(id => {
                            const allocation = allocations.find(a => a.id === id);
                            return allocation?.status === 'booked';
                          });
                          const result = await Swal.fire({
                            title: 'Check In Selected Guests?',
                            text: `Check in ${eligibleIds.length} selected guests?`,
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#16a34a',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Yes, check them in!',
                            cancelButtonText: 'Cancel'
                          });
                          if (result.isConfirmed && onBulkCheckIn) {
                            onBulkCheckIn(eligibleIds);
                          }
                        }}
                        disabled={bulkCheckingIn}
                        className="flex items-center gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        {bulkCheckingIn ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                        Check In
                      </Button>
                    )}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCSV}
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={printTable}
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Accommodation Type</label>
                  <Select value={filters.occupancy} onValueChange={(value) => setFilters({...filters, occupancy: value})}>
                    <SelectTrigger className="h-10 bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="guesthouse">Guesthouse</SelectItem>
                      <SelectItem value="vendor">Vendor Hotel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Room</label>
                  <Select value={filters.room} onValueChange={(value) => setFilters({...filters, room: value})}>
                    <SelectTrigger className="h-10 bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="all">All Rooms</SelectItem>
                      <SelectItem value="room 1">Room 1</SelectItem>
                      <SelectItem value="room 2">Room 2</SelectItem>
                      <SelectItem value="room 3">Room 3</SelectItem>
                      <SelectItem value="room 4">Room 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Event</label>
                  <Select value={filters.event} onValueChange={(value) => setFilters({...filters, event: value})}>
                    <SelectTrigger className="h-10 bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="all">All Events</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.title}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Gender</label>
                  <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value})}>
                    <SelectTrigger className="h-10 bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Status</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger className="h-10 bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="released">Released</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(endIndex, sortedAllocations.length)}</span> of <span className="font-semibold text-gray-900">{sortedAllocations.length}</span> results
          {searchQuery || activeFiltersCount > 0 ? (
            <span> (filtered from {allocations.length} total allocations)</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Rows per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="h-8 w-20 bg-white border border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-2 border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.length === paginatedAllocations.length && paginatedAllocations.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none"
                onClick={() => handleSort('guest_name')}
              >
                <div className="flex items-center">
                  Guest Name
                  {getSortIcon('guest_name')}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none"
                onClick={() => handleSort('accommodation_type')}
              >
                <div className="flex items-center">
                  Occupancy
                  {getSortIcon('accommodation_type')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Shared
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none"
                onClick={() => handleSort('event')}
              >
                <div className="flex items-center">
                  Event
                  {getSortIcon('event')}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none"
                onClick={() => handleSort('days')}
              >
                <div className="flex items-center">
                  Days
                  {getSortIcon('days')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Gender
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAllocations.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900 mb-1">
                        No results found
                      </div>
                      <div className="text-sm text-gray-500">
                        Try adjusting your search or filters to find what you're looking for
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedAllocations.map((allocation) => {
                const accommodationInfo = getAccommodationInfo(allocation);
                const Icon = accommodationInfo.icon;

                return (
                  <tr key={allocation.id} className={`hover:bg-gray-50 transition-all ${
                    selectedRows.includes(allocation.id) ? 'bg-blue-50 hover:bg-blue-100' : ''
                  }`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(allocation.id)}
                        onChange={(e) => handleRowSelect(allocation.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {allocation.guest_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {allocation.participant?.role || 'Guest'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-green-700" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{accommodationInfo.type}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{accommodationInfo.name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {accommodationInfo.room}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {accommodationInfo.occupancy}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={accommodationInfo.shared.startsWith("Yes") ? "default" : "outline"} className="text-xs font-medium">
                        {accommodationInfo.shared}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {allocation.event?.title || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {allocation.check_in_date && allocation.check_out_date ?
                          <><span className="text-lg font-bold text-red-600">{calculateDays(allocation.check_in_date, allocation.check_out_date)}</span> <span className="text-gray-500">days</span></> : '-'
                        }
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {allocation.participant?.gender || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge className={`${getStatusBadge(allocation.status)} font-medium`}>
                        {allocation.status.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {allocation.status === 'booked' && onCheckIn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 hover:bg-green-100 text-green-600 rounded-lg"
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: 'Check In Guest?',
                                text: `Check in ${allocation.guest_name}?`,
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#16a34a',
                                cancelButtonColor: '#6b7280',
                                confirmButtonText: 'Yes, check in!',
                                cancelButtonText: 'Cancel'
                              });
                              if (result.isConfirmed) {
                                onCheckIn(allocation.id);
                              }
                            }}
                            disabled={checkingIn === allocation.id}
                            title="Check In"
                          >
                            {checkingIn === allocation.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg"
                          onClick={() => {}}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Button>
                        {allocation.status !== 'checked_in' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 hover:bg-red-100 text-red-600 rounded-lg"
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: 'Delete Allocation?',
                                text: `Are you sure you want to delete the allocation for ${allocation.guest_name}?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#dc2626',
                                cancelButtonColor: '#6b7280',
                                confirmButtonText: 'Yes, delete it!',
                                cancelButtonText: 'Cancel'
                              });
                              if (result.isConfirmed) {
                                onDelete(allocation.id);
                              }
                            }}
                            disabled={deleting === allocation.id}
                            title="Delete Allocation"
                          >
                            {deleting === allocation.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-9 w-9 p-0 ${currentPage === pageNum ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
