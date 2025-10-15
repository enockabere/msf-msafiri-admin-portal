"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DietaryRequirement {
  participant_name: string;
  participant_email: string;
  dietary_requirements?: string;
  allergies?: string;
}

interface EventFoodProps {
  eventId: number;
  tenantSlug: string;
  eventHasEnded?: boolean;
  eventDays: number;
}

export default function EventFood({
  eventId,
  eventHasEnded = false,
  eventDays,
}: EventFoodProps) {
  const { accessToken } = useAuth();
  const [dietaryRequirements, setDietaryRequirements] = useState<DietaryRequirement[]>([]);

  // Dietary Requirements Table Component
  const DietaryRequirementsTable = ({ dietaryRequirements, eventId }: { dietaryRequirements: DietaryRequirement[], eventId: number }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<keyof DietaryRequirement>("participant_name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredData = dietaryRequirements.filter(req => 
      req.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.participant_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.dietary_requirements?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.allergies?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedData = [...filteredData].sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      const result = aVal.toString().localeCompare(bVal.toString());
      return sortDirection === "asc" ? result : -result;
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (field: keyof DietaryRequirement) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    };

    const handleDownload = () => {
      const csvContent = [
        ['Name', 'Email', 'Dietary Requirements', 'Allergies'].join(','),
        ...sortedData.map(req => [
          req.participant_name || '',
          req.participant_email || '',
          req.dietary_requirements || '',
          req.allergies || ''
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId}-dietary-requirements.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    };

    const requirementsCount = dietaryRequirements.filter(req => req.dietary_requirements || req.allergies).length;

    return (
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h4 className="font-semibold text-gray-900">Participant Dietary Requirements</h4>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {requirementsCount} with requirements
              </Badge>
            </div>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50" 
                  onClick={() => handleSort("participant_name")}
                >
                  Name {sortField === "participant_name" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50" 
                  onClick={() => handleSort("participant_email")}
                >
                  Email {sortField === "participant_email" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Dietary Requirements</TableHead>
                <TableHead>Allergies</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((req, index) => {
                const hasRequirements = req.dietary_requirements || req.allergies;
                return (
                  <TableRow key={index} className={hasRequirements ? "bg-amber-50" : ""}>
                    <TableCell className="font-medium">{req.participant_name || "Unknown"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{req.participant_email || "Unknown"}</TableCell>
                    <TableCell>
                      {req.dietary_requirements ? (
                        <span className="text-sm">{req.dietary_requirements}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {req.allergies ? (
                        <Badge variant="destructive" className="text-xs">{req.allergies}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasRequirements ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Special Requirements
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          No Requirements
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} participants
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {dietaryRequirements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p>No participant dietary information available</p>
          </div>
        )}
      </div>
    );
  };

  const fetchDietaryRequirements = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/food/dietary-requirements`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDietaryRequirements(data);
      }
    } catch (error) {
      console.error("Failed to fetch dietary requirements:", error);
    }
  }, [eventId, accessToken]);

  useEffect(() => {
    fetchDietaryRequirements();
  }, [fetchDietaryRequirements]);



  return (
    <div className="space-y-6">
      {/* Dietary Requirements Table */}
      <DietaryRequirementsTable 
        dietaryRequirements={dietaryRequirements}
        eventId={eventId}
      />
    </div>
  );
}