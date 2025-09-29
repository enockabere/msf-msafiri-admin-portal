"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { format, parseISO } from "date-fns";

interface AgendaItem {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  presenter?: string;
  session_number: string;
}

interface CurrentSessionProps {
  eventId: number;
  className?: string;
}

export default function CurrentSession({ eventId, className = "" }: CurrentSessionProps) {
  const [currentSession, setCurrentSession] = useState<{
    item: AgendaItem;
    status: 'current' | 'next' | 'completed';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendaAndDetermineSession = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/agenda`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const agendaItems: AgendaItem[] = await response.json();
          const now = new Date();
          
          const sortedItems = [...agendaItems].sort((a, b) => 
            new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
          );
          
          // Find current session (ongoing)
          const ongoing = sortedItems.find(item => {
            const start = new Date(item.start_datetime);
            const end = new Date(item.end_datetime);
            return now >= start && now <= end;
          });
          
          if (ongoing) {
            setCurrentSession({ item: ongoing, status: 'current' });
            return;
          }
          
          // Find next session
          const upcoming = sortedItems.find(item => {
            const start = new Date(item.start_datetime);
            return now < start;
          });
          
          if (upcoming) {
            setCurrentSession({ item: upcoming, status: 'next' });
            return;
          }
          
          // All sessions completed
          const lastSession = sortedItems[sortedItems.length - 1];
          if (lastSession) {
            setCurrentSession({ item: lastSession, status: 'completed' });
          }
        }
      } catch (error) {
        console.error("Failed to fetch agenda:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendaAndDetermineSession();
    
    // Update every minute
    const interval = setInterval(fetchAgendaAndDetermineSession, 60000);
    
    return () => clearInterval(interval);
  }, [eventId]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No sessions scheduled</p>
        </div>
      </div>
    );
  }

  const { item, status } = currentSession;
  
  const getStatusConfig = () => {
    switch (status) {
      case 'current':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          badgeColor: 'bg-green-100 text-green-800',
          icon: '🔴',
          label: 'Live Now'
        };
      case 'next':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          badgeColor: 'bg-blue-100 text-blue-800',
          icon: '⏰',
          label: 'Up Next'
        };
      case 'completed':
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          badgeColor: 'bg-gray-100 text-gray-800',
          icon: '✅',
          label: 'Completed'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <Badge className={`${config.badgeColor} text-xs font-medium`}>
          {config.icon} {config.label}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {item.session_number}
        </Badge>
      </div>
      
      <h4 className={`font-semibold ${config.textColor} mb-2`}>
        {item.title}
      </h4>
      
      {item.description && (
        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
      )}
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {format(parseISO(item.start_datetime), "MMM dd, HH:mm")} - {format(parseISO(item.end_datetime), "HH:mm")}
          </span>
        </div>
        
        {item.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>
        )}
        
        {item.presenter && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{item.presenter}</span>
          </div>
        )}
      </div>
      
      {status === 'current' && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center gap-2 text-xs text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Session in progress</span>
          </div>
        </div>
      )}
    </div>
  );
}