"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Hotel, Users, Calendar, MapPin, Trash2 } from "lucide-react";

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  location: string;
  accommodation_type: string;
  capacity: number;
  current_occupants: number;
}

interface VendorCardProps {
  vendor: VendorAccommodation;
  onBook: (vendor: VendorAccommodation) => void;
  onDelete?: (vendor: VendorAccommodation) => void;
  canEdit?: boolean;
}

export default function VendorCard({ vendor, onBook, onDelete, canEdit }: VendorCardProps) {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Hotel className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">{vendor.vendor_name}</CardTitle>
          </div>
          {getAvailabilityBadge()}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {vendor.location}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium">{vendor.capacity} Capacity</div>
              <div className="text-xs text-gray-500">{vendor.current_occupants} occupied</div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {vendor.accommodation_type}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Occupancy</span>
            <span className={`text-sm font-semibold ${getOccupancyColor(occupancyPercentage)}`}>
              {occupancyPercentage}%
            </span>
          </div>
          <Progress value={occupancyPercentage} className="h-2" />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => onBook(vendor)}
            disabled={vendor.current_occupants >= vendor.capacity}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book
          </Button>
          {canEdit && onDelete && (
            <Button 
              onClick={() => onDelete(vendor)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}