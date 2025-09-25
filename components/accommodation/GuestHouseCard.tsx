"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Users, Calendar, MapPin } from "lucide-react";

interface GuestHouse {
  id: number;
  name: string;
  location: string;
  total_rooms: number;
  total_capacity: number;
  current_occupants: number;
  available_rooms: number;
}

interface GuestHouseCardProps {
  guesthouse: GuestHouse;
  onBook: (guesthouse: GuestHouse) => void;
  onViewRooms?: (guesthouse: GuestHouse) => void;
}

export default function GuestHouseCard({ guesthouse, onBook, onViewRooms }: GuestHouseCardProps) {
  const occupancyPercentage = guesthouse.total_capacity > 0 
    ? Math.round((guesthouse.current_occupants / guesthouse.total_capacity) * 100) 
    : 0;

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getAvailabilityBadge = () => {
    if (guesthouse.available_rooms === 0) {
      return <Badge variant="destructive">Full</Badge>;
    }
    if (guesthouse.available_rooms <= 2) {
      return <Badge variant="secondary">Limited</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">{guesthouse.name}</CardTitle>
          </div>
          {getAvailabilityBadge()}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {guesthouse.location}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium">{guesthouse.total_rooms} Rooms</div>
              <div className="text-xs text-gray-500">{guesthouse.available_rooms} available</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium">{guesthouse.total_capacity} Capacity</div>
              <div className="text-xs text-gray-500">{guesthouse.current_occupants} occupied</div>
            </div>
          </div>
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
            onClick={() => onViewRooms && onViewRooms(guesthouse)}
            variant="outline"
            className="flex-1"
          >
            <Building2 className="w-4 h-4 mr-2" />
            View Rooms
          </Button>
          <Button 
            onClick={() => onBook(guesthouse)}
            disabled={guesthouse.available_rooms === 0}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}