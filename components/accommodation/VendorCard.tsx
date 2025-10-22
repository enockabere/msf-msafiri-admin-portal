"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Hotel, Users, Calendar, MapPin, Trash2, Settings } from "lucide-react";

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  location: string;
  accommodation_type: string;
  capacity: number;
  current_occupants: number;
  event_setups?: VendorEventSetup[];
}

interface VendorEventSetup {
  id: number;
  event_id?: number;
  event_name?: string;
  single_rooms: number;
  double_rooms: number;
  total_capacity: number;
  current_occupants: number;
  event?: {
    title: string;
    start_date: string;
    end_date: string;
  };
}

interface VendorCardProps {
  vendor: VendorAccommodation;
  onBook: (vendor: VendorAccommodation) => void;
  onDelete?: (vendor: VendorAccommodation) => void;
  onSetupEvent?: (vendor: VendorAccommodation) => void;
  onEditSetup?: (setup: VendorEventSetup) => void;
  onDeleteSetup?: (setup: VendorEventSetup) => void;
  canEdit?: boolean;
}

export default function VendorCard({ vendor, onBook, onDelete, onSetupEvent, onEditSetup, onDeleteSetup, canEdit }: VendorCardProps) {
  const occupancyPercentage = vendor.capacity > 0 
    ? Math.round((vendor.current_occupants / vendor.capacity) * 100) 
    : 0;

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getAvailabilityBadge = () => {
    const availableSpaces = vendor.capacity - vendor.current_occupants;
    if (availableSpaces === 0) {
      return <Badge variant="destructive">Full</Badge>;
    }
    if (availableSpaces <= 2) {
      return <Badge variant="secondary">Limited</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 border-gray-100 hover:border-purple-200">
      <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">{vendor.vendor_name}</CardTitle>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {vendor.location}
              </div>
            </div>
          </div>
          {getAvailabilityBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">{vendor.capacity} Capacity</div>
              <div className="text-xs text-gray-500">{vendor.current_occupants} occupied</div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-normal border-purple-200 text-purple-700">
            {vendor.accommodation_type}
          </Badge>
        </div>

        {/* Remove overall occupancy stats - now shown per setup */}

        {/* Event Setups */}
        {vendor.event_setups && vendor.event_setups.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Event Setups:</span>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {vendor.event_setups.map((setup) => {
                const setupOccupancy = setup.total_capacity > 0 ? Math.round((setup.current_occupants / setup.total_capacity) * 100) : 0;
                const isOccupied = setup.current_occupants > 0;
                
                return (
                  <div key={setup.id} className="bg-white p-2 rounded border text-xs">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-purple-700">
                          {setup.event?.title || setup.event_name || 'Custom Event'}
                        </div>
                        <div className="text-gray-600">
                          {setup.single_rooms}S + {setup.double_rooms}D = {setup.total_capacity} capacity
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`text-xs font-medium ${
                            setupOccupancy >= 90 ? 'text-red-600' : 
                            setupOccupancy >= 70 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {setupOccupancy}% occupied
                          </div>
                          <div className="text-xs text-gray-500">
                            ({setup.current_occupants}/{setup.total_capacity})
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSetup?.(setup);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit setup"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {!isOccupied && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSetup?.(setup);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete setup"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {canEdit && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            {onSetupEvent && (
              <Button
                onClick={() => onSetupEvent(vendor)}
                variant="outline"
                size="sm"
                className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 font-normal"
              >
                <Settings className="w-4 h-4 mr-2" />
                Setup Event Accommodation
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(vendor)}
                variant="outline"
                size="sm"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-normal"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Vendor
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}