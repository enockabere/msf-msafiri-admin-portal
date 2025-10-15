"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Trash2, User, Eye, Building, Hotel, Loader2, UserCheck, Filter, Download, Printer, Users } from "lucide-react";
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

export default function AllocationsList({ allocations, onDelete, deleting, onCheckIn, checkingIn, events = [], onBulkCheckIn, bulkCheckingIn }: AllocationsListProps) {

  const [filters, setFilters] = useState({
    occupancy: 'all',
    room: 'all',
    event: 'all',
    gender: 'all',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);



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
      return {
        type: "Vendor Hotel",
        name: allocation.vendor_accommodation.vendor_name,
        room: roomTypeDisplay,
        occupancy: `${allocation.vendor_accommodation.current_occupants}/${allocation.vendor_accommodation.capacity}`,
        shared: allocation.room_type === "double" ? "Possible" : "No",
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
      setSelectedRows(filteredAllocations.map(a => a.id));
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
      booked: "bg-blue-100 text-blue-800",
      checked_in: "bg-green-100 text-green-800",
      released: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const filteredAllocations = allocations.filter(allocation => {
    const accommodationInfo = getAccommodationInfo(allocation);
    
    if (filters.occupancy !== 'all' && !accommodationInfo.type.toLowerCase().includes(filters.occupancy.toLowerCase())) return false;
    if (filters.room !== 'all' && !accommodationInfo.room.toLowerCase().includes(filters.room.toLowerCase())) return false;
    if (filters.event !== 'all' && allocation.event?.title !== filters.event) return false;
    if (filters.gender !== 'all' && !(allocation.participant?.gender || '').toLowerCase().includes(filters.gender.toLowerCase())) return false;
    if (filters.status !== 'all' && allocation.status !== filters.status) return false;
    
    return true;
  });

  if (allocations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No visitor allocations found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          {(filters.occupancy !== 'all' || filters.room !== 'all' || filters.event !== 'all' || filters.gender !== 'all' || filters.status !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ occupancy: 'all', room: 'all', event: 'all', gender: 'all', status: 'all' })}
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedRows.length} selected</span>
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
                  className="flex items-center gap-2"
                >
                  {bulkCheckingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  Check In Selected
                </Button>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={printTable}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Occupancy</label>
                <Select value={filters.occupancy} onValueChange={(value) => setFilters({...filters, occupancy: value})}>
                  <SelectTrigger className="h-8 bg-white border border-gray-300">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="guesthouse">Guesthouse</SelectItem>
                    <SelectItem value="vendor">Vendor Hotel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Room</label>
                <Select value={filters.room} onValueChange={(value) => setFilters({...filters, room: value})}>
                  <SelectTrigger className="h-8 bg-white border border-gray-300">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="room 1">Room 1</SelectItem>
                    <SelectItem value="room 2">Room 2</SelectItem>
                    <SelectItem value="room 3">Room 3</SelectItem>
                    <SelectItem value="room 4">Room 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Event</label>
                <Select value={filters.event} onValueChange={(value) => setFilters({...filters, event: value})}>
                  <SelectTrigger className="h-8 bg-white border border-gray-300">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.title}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Gender</label>
                <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value})}>
                  <SelectTrigger className="h-8 bg-white border border-gray-300">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="h-8 bg-white border border-gray-300">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedRows.length === filteredAllocations.length && filteredAllocations.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Guest Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Occupancy
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Room
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Shared
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Days
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAllocations.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      No visitor allocations found
                    </div>
                    <div className="text-xs text-gray-500">
                      Allocations will appear here once visitors are assigned
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAllocations.map((allocation) => {
                const accommodationInfo = getAccommodationInfo(allocation);
                const Icon = accommodationInfo.icon;
                
                return (
                  <tr key={allocation.id} className={`hover:bg-gray-50 transition-colors ${
                    selectedRows.includes(allocation.id) ? 'bg-blue-50' : ''
                  }`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(allocation.id)}
                        onChange={(e) => handleRowSelect(allocation.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-700" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {allocation.guest_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {allocation.participant?.role || 'Guest'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center">
                          <Icon className="w-3 h-3 text-green-700" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{accommodationInfo.type}</div>
                          <div className="text-xs text-gray-500">{accommodationInfo.name}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {accommodationInfo.room}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <Badge variant={accommodationInfo.shared === "Yes" ? "default" : "outline"} className="text-xs">
                        {accommodationInfo.shared}
                      </Badge>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {allocation.event?.title || '-'}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {allocation.check_in_date && allocation.check_out_date ? 
                          `${calculateDays(allocation.check_in_date, allocation.check_out_date)} days` : '-'
                        }
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 capitalize">
                        {allocation.participant?.gender || '-'}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <Badge className={getStatusBadge(allocation.status)}>
                        {allocation.status}
                      </Badge>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {allocation.status === 'booked' && onCheckIn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-50 text-green-600"
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
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => {}}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {allocation.status !== 'checked_in' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
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
      </div>
    </div>
  );
}