"use client";

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
} from "lucide-react";

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
  duration_days?: number;
  created_by: string;
  created_at: string;
  participant_count?: number;
  selected_count?: number;
  checked_in_count?: number;
  event_status?: 'upcoming' | 'ongoing' | 'ended';
}

interface EventTableProps {
  data: Event[];
  canManageEvents: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onViewDetails: (event: Event) => void;
  sortField: keyof Event;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Event) => void;
}

export function EventTable({ 
  data, 
  canManageEvents, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  sortField, 
  sortDirection, 
  onSort 
}: EventTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-200';
      case 'ended': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'ongoing': return <Play className="w-4 h-4" />;
      case 'ended': return <CheckCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('title')}
              >
                <div className="flex items-center">
                  Event
                  {sortField === 'title' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type & Status
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('start_date')}
              >
                <div className="flex items-center">
                  Dates
                  {sortField === 'start_date' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Participants
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('created_at')}
              >
                <div className="flex items-center">
                  Created
                  {sortField === 'created_at' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </div>
              </th>
              {canManageEvents && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onViewDetails(event)}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex-shrink-0">
                      {getStatusIcon(event.event_status || '')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900">
                      {event.event_type || 'N/A'}
                    </div>
                    <div className="flex gap-1">
                      <Badge
                        className={event.status === 'Published' ? 'text-xs font-medium bg-green-100 text-green-800 border-green-200' : 'text-xs font-medium bg-yellow-100 text-yellow-800 border-yellow-200'}
                      >
                        {event.status}
                      </Badge>
                      <Badge className={'text-xs font-medium ' + getStatusColor(event.event_status || '')}>
                        {event.event_status ? event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    to {new Date(event.end_date).toLocaleDateString()}
                  </div>
                  {event.duration_days && (
                    <div className="text-xs text-blue-600">
                      {event.duration_days} days
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">
                    {event.location || 'TBD'}
                  </div>
                  {event.address && (
                    <div className="text-xs text-gray-500 truncate">
                      {event.address}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Reg:</span>
                      <span className="font-semibold text-gray-800">{event.participant_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <UserCheck className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Sel:</span>
                      <span className="font-semibold text-green-700">{event.selected_count || 0}</span>
                    </div>
                    {event.event_status === 'ongoing' && (
                      <div className="flex items-center gap-1 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">In:</span>
                        <span className="font-semibold text-blue-700">{event.checked_in_count || 0}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">
                    {new Date(event.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    by {event.created_by}
                  </div>
                </td>
                {canManageEvents && (
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg rounded-md">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(event);
                          }}
                          className="gap-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </DropdownMenuItem>
                        {event.status === 'Draft' && event.event_status !== 'ended' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(event);
                            }}
                            className="gap-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {event.status === 'Draft' && event.event_status !== 'ended' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(event);
                            }}
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}