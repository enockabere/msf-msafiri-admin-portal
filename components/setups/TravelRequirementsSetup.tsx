"use client";

import { useState, useEffect } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, AlertCircle, CheckCircle2, Plane, FileText, CreditCard, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface TravelRequirement {
  id?: number;
  country: string;
  visa_required: boolean;
  eta_required: boolean;
  passport_required: boolean;
  flight_ticket_required: boolean;
}

interface TravelRequirementsSetupProps {
  tenantSlug: string;
}

export default function TravelRequirementsSetup({ tenantSlug }: TravelRequirementsSetupProps) {
  const [countries, setCountries] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<Record<string, TravelRequirement>>({});
  const [tenantCountry, setTenantCountry] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { apiClient } = useAuthenticatedApi();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantSlug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch countries list
      const countriesResponse = await apiClient.request<{ countries: string[] }>("/countries");
      setCountries(countriesResponse.countries);

      // Fetch tenant info to get base country
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`);
      setTenantCountry(tenantResponse.country || "");

      // Fetch existing travel requirements
      const requirementsResponse = await apiClient.request<TravelRequirement[]>(
        `/country-travel-requirements/tenant/${tenantResponse.id}`
      );

      // Convert array to object for easier lookup
      const requirementsMap: Record<string, TravelRequirement> = {};
      requirementsResponse.forEach(req => {
        requirementsMap[req.country] = req;
      });
      setRequirements(requirementsMap);

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load travel requirements data");
    } finally {
      setLoading(false);
    }
  };

  const updateRequirement = async (country: string, field: keyof Omit<TravelRequirement, 'id' | 'country'>, value: boolean) => {
    try {
      setSaving(country);
      
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`);
      const tenantId = tenantResponse.id;

      const currentReq = requirements[country] || {
        country,
        visa_required: false,
        eta_required: false,
        passport_required: true,
        flight_ticket_required: true
      };

      const updatedReq = { ...currentReq, [field]: value };

      if (currentReq.id) {
        // Update existing requirement
        await apiClient.request(
          `/country-travel-requirements/tenant/${tenantId}/country/${encodeURIComponent(country)}`,
          {
            method: "PUT",
            body: JSON.stringify({ [field]: value })
          }
        );
      } else {
        // Create new requirement
        const response = await apiClient.request<TravelRequirement>(
          `/country-travel-requirements/tenant/${tenantId}`,
          {
            method: "POST",
            body: JSON.stringify(updatedReq)
          }
        );
        updatedReq.id = response.id;
      }

      setRequirements(prev => ({
        ...prev,
        [country]: updatedReq
      }));

      toast({
        title: "Success",
        description: `Travel requirements updated for ${country}`
      });

    } catch (error) {
      console.error("Error updating requirement:", error);
      toast({
        title: "Error",
        description: "Failed to update travel requirements",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const getRequirementValue = (country: string, field: keyof Omit<TravelRequirement, 'id' | 'country'>): boolean => {
    const req = requirements[country];
    if (!req) {
      // Default values for new countries
      return field === 'passport_required' || field === 'flight_ticket_required';
    }
    return req[field];
  };

  const hasAnyRequirements = (country: string): boolean => {
    const req = requirements[country];
    return req ? (req.visa_required || req.eta_required || req.passport_required || req.flight_ticket_required) : true;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading travel requirements...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Travel Requirements Setup
          </CardTitle>
          <CardDescription>
            Configure travel requirements for visitors traveling to {tenantCountry || "your base country"}. 
            Check the boxes for each country to specify what documents are required for travel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenantCountry && (
            <Alert className="mb-6">
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Base Country:</strong> {tenantCountry}
                <br />
                Configure requirements for visitors from other countries traveling to {tenantCountry}.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {countries
                .filter(country => country !== tenantCountry) // Exclude base country
                .sort()
                .map((country) => (
                <Card key={country} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {country}
                      {hasAnyRequirements(country) && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configured
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {saving === country && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`visa-${country}`}
                          checked={getRequirementValue(country, 'visa_required')}
                          onCheckedChange={(checked) => 
                            updateRequirement(country, 'visa_required', checked as boolean)
                          }
                          disabled={saving === country}
                        />
                        <label 
                          htmlFor={`visa-${country}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Visa Required
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`eta-${country}`}
                          checked={getRequirementValue(country, 'eta_required')}
                          onCheckedChange={(checked) => 
                            updateRequirement(country, 'eta_required', checked as boolean)
                          }
                          disabled={saving === country}
                        />
                        <label 
                          htmlFor={`eta-${country}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          eTA Required
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`passport-${country}`}
                          checked={getRequirementValue(country, 'passport_required')}
                          onCheckedChange={(checked) => 
                            updateRequirement(country, 'passport_required', checked as boolean)
                          }
                          disabled={saving === country}
                        />
                        <label 
                          htmlFor={`passport-${country}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Passport Required
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`ticket-${country}`}
                          checked={getRequirementValue(country, 'flight_ticket_required')}
                          onCheckedChange={(checked) => 
                            updateRequirement(country, 'flight_ticket_required', checked as boolean)
                          }
                          disabled={saving === country}
                        />
                        <label 
                          htmlFor={`ticket-${country}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                        >
                          <CreditCard className="h-3 w-3" />
                          Flight Ticket Required
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}