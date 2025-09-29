"use client";

import { Home, MapPin, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AccommodationDetails {
  type: string;
  name: string;
  location: string;
  address: string;
  check_in_date?: string;
  check_out_date?: string;
  status?: string;
  room_capacity?: number;
  room_occupants?: number;
  is_shared?: boolean;
}

interface AccommodationReportProps {
  accommodationDetails: AccommodationDetails[];
  participantName: string;
}

export default function AccommodationReport({ accommodationDetails, participantName }: AccommodationReportProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "selected":
      case "attended":
        return "bg-green-100 text-green-800";
      case "pending":
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "not_selected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Accommodation Report</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Accommodation arrangements for {participantName}</p>
      </div>

      <div className="p-4">
        {accommodationDetails.length > 0 ? (
          <div className="space-y-4">
            {accommodationDetails.map((accommodation, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-sm">
                    {accommodation.type.toUpperCase()}
                  </Badge>
                  {accommodation.status && (
                    <Badge className={`text-sm ${getStatusColor(accommodation.status)}`}>
                      {accommodation.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Property</p>
                      <p className="text-sm text-gray-600">{accommodation.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">{accommodation.location}</p>
                      {accommodation.address && (
                        <p className="text-xs text-gray-500 mt-1">{accommodation.address}</p>
                      )}
                    </div>
                  </div>

                  {accommodation.check_in_date && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Stay Period</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(accommodation.check_in_date)} - {
                            accommodation.check_out_date ? formatDate(accommodation.check_out_date) : 'TBD'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {accommodation.is_shared !== undefined && (
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Room Details</p>
                        <p className="text-sm text-gray-600">
                          {accommodation.is_shared ? 'Shared Room' : 'Private Room'}
                          {accommodation.room_capacity && accommodation.room_occupants && (
                            <span className="ml-2">
                              ({accommodation.room_occupants}/{accommodation.room_capacity} occupants)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No accommodation arrangements found</p>
          </div>
        )}
      </div>
    </div>
  );
}