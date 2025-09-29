"use client";

import { Car, MapPin, Calendar, User, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransportDetails {
  id: number;
  booking_type: string;
  status: string;
  pickup_locations: string[];
  destination: string;
  scheduled_time: string;
  has_welcome_package: boolean;
  package_pickup_location?: string;
  package_collected: boolean;
  vendor_name?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_details?: string;
  flight_number?: string;
  arrival_time?: string;
}

interface TransportReportProps {
  transportDetails: TransportDetails[];
  participantName: string;
}

export default function TransportReport({ transportDetails, participantName }: TransportReportProps) {
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
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Transport Report</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Transport arrangements for {participantName}</p>
      </div>

      <div className="p-4">
        {transportDetails.length > 0 ? (
          <div className="space-y-4">
            {transportDetails.map((transport) => (
              <div key={transport.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-sm">
                    {transport.booking_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className={`text-sm ${getStatusColor(transport.status)}`}>
                    {transport.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Route</p>
                        <p className="text-sm text-gray-600">
                          {transport.pickup_locations.join(', ')} → {transport.destination}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Schedule</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(transport.scheduled_time)} at {formatTime(transport.scheduled_time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {transport.driver_name && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Driver</p>
                          <p className="text-sm text-gray-600">{transport.driver_name}</p>
                          {transport.driver_phone && (
                            <p className="text-xs text-gray-500">{transport.driver_phone}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {transport.vehicle_details && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Vehicle</p>
                        <p className="text-sm text-gray-600">{transport.vehicle_details}</p>
                      </div>
                    )}

                    {transport.flight_number && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Flight</p>
                        <p className="text-sm text-gray-600">
                          {transport.flight_number}
                          {transport.arrival_time && ` - Arrives ${formatTime(transport.arrival_time)}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {transport.has_welcome_package && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-gray-900">Welcome Package</span>
                      <Badge variant="outline" className={`text-xs ${
                        transport.package_collected ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {transport.package_collected ? 'Collected' : 'Pending'}
                      </Badge>
                    </div>
                    {transport.package_pickup_location && (
                      <p className="text-sm text-gray-600 mt-1">
                        Pickup: {transport.package_pickup_location}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No transport arrangements found</p>
          </div>
        )}
      </div>
    </div>
  );
}