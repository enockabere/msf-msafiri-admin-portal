"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Clock,
  Play,
  CheckCircle,
  Users,
  UserCheck,
  FileText,
} from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";

interface Event {
  id: number;
  title: string;
  description?: string;
  event_type?: string;
  status: string;
  start_date: string;
  end_date: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  banner_image?: string;
  duration_days?: number;
  perdiem_rate?: number;
  perdiem_currency?: string;
  tenant_id?: number;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  participant_count?: number;
  selected_count?: number;
  tenant_name?: string;
  checked_in_count?: number;
  event_status?: 'upcoming' | 'ongoing' | 'ended';
  days_until_start?: number;
}

interface EventCardProps {
  event: Event;
  canManageEvents: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onUnpublish?: (event: Event) => void;
  onViewDetails: (event: Event) => void;
  onRegistrationForm?: (event: Event) => void;
}

export function EventCard({ event, canManageEvents, onEdit, onDelete, onUnpublish, onViewDetails, onRegistrationForm }: EventCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'from-blue-50 to-blue-100';
      case 'ongoing': return 'from-green-50 to-green-100';
      case 'ended': return 'from-gray-50 to-gray-100';
      default: return 'from-white to-red-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />;
      case 'ongoing': return <Play className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />;
      case 'ended': return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />;
      default: return <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />;
    }
  };

  const getStatusText = () => {
    if (event.event_status === 'upcoming' && event.days_until_start) {
      return event.days_until_start === 1 ? 'Starts tomorrow' : 'Starts in ' + event.days_until_start + ' days';
    }
    if (event.event_status === 'ongoing') {
      return 'Event in progress';
    }
    if (event.event_status === 'ended') {
      return 'Event completed';
    }
    return '';
  };

  return (
    <Card
      className={'shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br ' + getStatusColor(event.event_status || '') + ' cursor-pointer'}
      onClick={() => onViewDetails(event)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200 shadow-sm flex-shrink-0">
              {getStatusIcon(event.event_status || '')}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-1 line-clamp-2 break-words">
                {event.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {event.event_type}
              </p>
              {getStatusText() && (
                <p className="text-xs font-medium text-blue-600 mt-1">
                  {getStatusText()}
                </p>
              )}
            </div>
            {canManageEvents && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white border-2 border-gray-200 rounded-lg shadow-lg"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(event);
                    }}
                    className="hover:bg-red-50 focus:bg-red-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {onRegistrationForm && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegistrationForm(event);
                      }}
                      className="hover:bg-red-50 focus:bg-red-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Registration Form
                    </DropdownMenuItem>
                  )}
                  {event.status === 'Draft' && event.event_status !== 'ended' && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(event);
                      }}
                      className="hover:bg-red-50 focus:bg-red-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {event.status === 'Published' && event.event_status === 'upcoming' && onUnpublish && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpublish(event);
                      }}
                      className="text-orange-600 hover:bg-orange-50 focus:bg-orange-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Unpublish
                    </DropdownMenuItem>
                  )}
                  {event.status === 'Draft' && event.event_status !== 'ended' && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(event);
                      }}
                      className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {event.banner_image && event.banner_image.trim() && (
            <div className="mb-3">
              <LazyImage
                src={event.banner_image}
                alt={`${event.title} banner`}
                className="w-full h-32 rounded-lg border"
                placeholder={
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    Loading...
                  </div>
                }
              />
            </div>
          )}

          <div className="flex-1 space-y-2 sm:space-y-3">
            <div className="text-sm sm:text-base text-gray-600">
              <span className="font-medium">Location:</span>
              <span className="text-gray-800 font-semibold ml-1 break-words">
                {event.location || "TBD"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Registered:</span>
                <span className="font-semibold text-gray-800">{event.participant_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Selected:</span>
                <span className="font-semibold text-green-700">{event.selected_count || 0}</span>
              </div>
            </div>

            {event.event_status === 'ongoing' && (
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Checked In:</span>
                <span className="font-semibold text-blue-700">{event.checked_in_count || 0}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1 sm:gap-2">
              <Badge
                className={event.status === "Published" ? "px-2 py-1 text-xs font-medium bg-green-100 text-green-800" : "px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800"}
              >
                {event.status}
              </Badge>
              <Badge
                variant="outline"
                className="px-2 py-1 text-xs font-medium border-2 border-red-200 text-red-700 bg-red-50"
              >
                {Math.floor(Math.abs(new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
              </Badge>
              <Badge
                className={event.event_status === 'upcoming' ? 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800' : event.event_status === 'ongoing' ? 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800' : 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800'}
              >
                {event.event_status ? event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1) : 'Unknown'}
              </Badge>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-gray-200 truncate">
            Created by {event.created_by}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}