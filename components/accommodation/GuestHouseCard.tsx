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
    <Card className="hover:shadow-lg transition-all duration-200 border-2 border-gray-100 hover:border-blue-200">
      <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">{guesthouse.name}</CardTitle>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {guesthouse.location}
              </div>
            </div>
          </div>
          {getAvailabilityBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900">{guesthouse.total_rooms} Rooms</div>
              <div className="text-xs text-gray-500">{guesthouse.available_rooms} available</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Users className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900">{guesthouse.total_capacity} Capacity</div>
              <div className="text-xs text-gray-500">{guesthouse.current_occupants} occupied</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-normal text-gray-600">Occupancy</span>
            <span className={`text-lg font-semibold ${getOccupancyColor(occupancyPercentage)}`}>
              {occupancyPercentage}%
            </span>
          </div>
          <Progress value={occupancyPercentage} className="h-2.5" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{guesthouse.current_occupants} occupied</span>
            <span>{guesthouse.total_capacity - guesthouse.current_occupants} available</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <Button
            onClick={() => onViewRooms && onViewRooms(guesthouse)}
            variant="outline"
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-normal"
          >
            <Building2 className="w-4 h-4 mr-2" />
            View Rooms
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}