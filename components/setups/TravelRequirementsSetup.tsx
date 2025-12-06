"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Save, AlertCircle, CheckCircle2, Plane, FileText, CreditCard, MapPin, Search, Filter, BarChart3, Globe, Plus, X, Edit3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdditionalRequirement {
  name: string;
  required: boolean;
  description?: string;
}

interface TravelRequirement {
  id?: number;
  country: string;
  visa_required: boolean;
  eta_required: boolean;
  passport_required: boolean;
  flight_ticket_required: boolean;
  additional_requirements?: AdditionalRequirement[];
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "configured" | "unconfigured">("all");
  const [editingAdditional, setEditingAdditional] = useState<string | null>(null);
  const [newRequirement, setNewRequirement] = useState({ name: "", description: "" });
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [showDefaultsModal, setShowDefaultsModal] = useState(false);
  const [defaultSettings, setDefaultSettings] = useState({
    visa_required: false,
    eta_required: false,
    passport_required: true,
    flight_ticket_required: true
  });
  const { apiClient } = useAuthenticatedApi();


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
      try {
        const requirementsResponse = await apiClient.request<TravelRequirement[]>(
          `/country-travel-requirements/tenant/${tenantResponse.id}`
        );

        // Convert array to object for easier lookup
        const requirementsMap: Record<string, TravelRequirement> = {};
        requirementsResponse.forEach(req => {
          requirementsMap[req.country] = req;
        });
        setRequirements(requirementsMap);
      } catch (reqError) {
        console.error("Error fetching travel requirements:", reqError);
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
        console.log("Tenant ID:", tenantResponse.id);
        // Set empty requirements instead of failing completely
        setRequirements({});
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load travel requirements data");
    } finally {
      setLoading(false);
    }
  };

  const applyToAllCountries = async () => {
    try {
      setCreatingDefaults(true);

      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`);
      const tenantId = tenantResponse.id;

      // Get all countries except tenant country
      const allCountries = countries.filter(country => country !== tenantCountry);
      let updatedCount = 0;
      const updatedRequirements: Record<string, TravelRequirement> = { ...requirements };

      // Apply settings to all countries
      for (const country of allCountries) {
        try {
          const currentReq = requirements[country];
          const newReq = {
            country,
            visa_required: defaultSettings.visa_required,
            eta_required: defaultSettings.eta_required,
            passport_required: defaultSettings.passport_required,
            flight_ticket_required: defaultSettings.flight_ticket_required,
            additional_requirements: currentReq?.additional_requirements || []
          };

          let response;
          if (currentReq?.id) {
            // Update existing requirement
            response = await apiClient.request<TravelRequirement>(
              `/country-travel-requirements/tenant/${tenantId}/country/${encodeURIComponent(country)}`,
              {
                method: "PUT",
                body: JSON.stringify({
                  visa_required: newReq.visa_required,
                  eta_required: newReq.eta_required,
                  passport_required: newReq.passport_required,
                  flight_ticket_required: newReq.flight_ticket_required
                })
              }
            );
          } else {
            // Create new requirement
            response = await apiClient.request<TravelRequirement>(
              `/country-travel-requirements/tenant/${tenantId}`,
              {
                method: "POST",
                body: JSON.stringify(newReq)
              }
            );
          }

          updatedRequirements[country] = response;
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update requirements for ${country}:`, error);
        }
      }

      // Update all requirements at once to trigger stats recalculation
      setRequirements(updatedRequirements);

      toast({
        title: "Success",
        description: `Requirements updated for ${updatedCount} countries`
      });

      setShowDefaultsModal(false);

    } catch (error) {
      console.error("Error updating requirements:", error);
      toast({
        title: "Error",
        description: "Failed to update requirements",
        variant: "destructive"
      });
    } finally {
      setCreatingDefaults(false);
    }
  };

  const addAdditionalRequirement = async (country: string) => {
    if (!newRequirement.name.trim()) return;
    
    const currentReq = requirements[country] || {
      country,
      visa_required: false,
      eta_required: false,
      passport_required: true,
      flight_ticket_required: true,
      additional_requirements: []
    };
    
    const updatedAdditional = [
      ...(currentReq.additional_requirements || []),
      {
        name: newRequirement.name.trim(),
        required: false,
        description: newRequirement.description.trim() || undefined
      }
    ];
    
    await updateRequirement(country, 'additional_requirements', updatedAdditional);
    setNewRequirement({ name: "", description: "" });
    setEditingAdditional(null);
  };
  
  const removeAdditionalRequirement = async (country: string, index: number) => {
    const currentReq = requirements[country];
    if (!currentReq?.additional_requirements) return;
    
    const updatedAdditional = currentReq.additional_requirements.filter((_, i) => i !== index);
    await updateRequirement(country, 'additional_requirements', updatedAdditional);
  };
  
  const toggleAdditionalRequirement = async (country: string, index: number) => {
    const currentReq = requirements[country];
    if (!currentReq?.additional_requirements) return;
    
    const updatedAdditional = currentReq.additional_requirements.map((req, i) => 
      i === index ? { ...req, required: !req.required } : req
    );
    await updateRequirement(country, 'additional_requirements', updatedAdditional);
  };

  const updateRequirement = async (country: string, field: keyof Omit<TravelRequirement, 'id' | 'country'>, value: boolean | AdditionalRequirement[]) => {
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

      let updatedReq = { ...currentReq, [field]: value };

      if (currentReq.id) {
        // Update existing requirement
        const response = await apiClient.request<TravelRequirement>(
          `/country-travel-requirements/tenant/${tenantId}/country/${encodeURIComponent(country)}`,
          {
            method: "PUT",
            body: JSON.stringify({ [field]: value })
          }
        );
        updatedReq = response;
      } else {
        // Create new requirement
        const response = await apiClient.request<TravelRequirement>(
          `/country-travel-requirements/tenant/${tenantId}`,
          {
            method: "POST",
            body: JSON.stringify(updatedReq)
          }
        );
        updatedReq = response;
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

  // Filter and search countries
  const filteredCountries = useMemo(() => {
    let result = countries.filter(country => country !== tenantCountry);

    // Apply search filter
    if (searchQuery) {
      result = result.filter(country =>
        country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply configuration filter
    if (filterType === "configured") {
      result = result.filter(country => requirements[country]?.id);
    } else if (filterType === "unconfigured") {
      result = result.filter(country => !requirements[country]?.id);
    }

    return result.sort();
  }, [countries, tenantCountry, searchQuery, filterType, requirements]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCountries = countries.filter(c => c !== tenantCountry).length;
    const configuredCountries = Object.values(requirements).filter(r => r.id).length;
    const visaRequired = Object.values(requirements).filter(r => r.visa_required).length;
    const etaRequired = Object.values(requirements).filter(r => r.eta_required).length;

    return {
      total: totalCountries,
      configured: configuredCountries,
      unconfigured: totalCountries - configuredCountries,
      visaRequired,
      etaRequired,
    };
  }, [countries, tenantCountry, requirements]);

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
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Plane className="h-5 w-5 text-primary" />
            </div>
            Travel Requirements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure travel requirements for visitors traveling to {tenantCountry || "your base country"}
          </p>
        </div>
      </div>

      {/* Base Country Info */}
      {tenantCountry && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Base Country: {tenantCountry}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure requirements for visitors from other countries traveling to {tenantCountry}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Total Countries</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-200/50 rounded-lg">
                <Globe className="h-4 w-4 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">Configured</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{stats.configured}</p>
              </div>
              <div className="p-2 bg-green-200/50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-700">Pending</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{stats.unconfigured}</p>
              </div>
              <div className="p-2 bg-amber-200/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700">Visa Required</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{stats.visaRequired}</p>
              </div>
              <div className="p-2 bg-purple-200/50 rounded-lg">
                <FileText className="h-4 w-4 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-700">eTA Required</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">{stats.etaRequired}</p>
              </div>
              <div className="p-2 bg-rose-200/50 rounded-lg">
                <CreditCard className="h-4 w-4 text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filterType === "all" ? "default" : "outline"}
                    onClick={() => setFilterType("all")}
                    className="flex items-center gap-1.5 h-9 text-xs flex-1 sm:flex-none"
                    size="sm"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">All</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show all countries</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filterType === "configured" ? "default" : "outline"}
                    onClick={() => setFilterType("configured")}
                    className="flex items-center gap-1.5 h-9 text-xs flex-1 sm:flex-none"
                    size="sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Configured</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show countries with requirements set</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filterType === "unconfigured" ? "default" : "outline"}
                    onClick={() => setFilterType("unconfigured")}
                    className="flex items-center gap-1.5 h-9 text-xs flex-1 sm:flex-none"
                    size="sm"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Pending</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show countries without requirements</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowDefaultsModal(true)}
                    disabled={creatingDefaults}
                    className="flex items-center gap-1.5 h-9 text-xs bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                    size="sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Configure All Countries</span>
                    <span className="sm:hidden">Configure All</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Apply default settings to all countries at once</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Countries Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Country Requirements</CardTitle>
          <CardDescription className="text-xs">
            {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCountries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 bg-muted rounded-full mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm mb-1">No countries found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Try adjusting your search or filter criteria to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredCountries.map((country) => {
                const isConfigured = !!requirements[country]?.id;
                const visaReq = getRequirementValue(country, 'visa_required');
                const etaReq = getRequirementValue(country, 'eta_required');

                return (
                  <Card
                    key={country}
                    className={`relative transition-all hover:shadow-lg ${
                      isConfigured ? 'border-green-200 bg-green-50/30' : 'border-muted'
                    }`}
                  >
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {country}
                        </CardTitle>
                        {isConfigured && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                            Set
                          </Badge>
                        )}
                      </div>
                      {(visaReq || etaReq) && (
                        <div className="flex gap-1 mt-1.5">
                          {visaReq && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                              Visa
                            </Badge>
                          )}
                          {etaReq && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 border-rose-200">
                              eTA
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 p-3 sm:p-4 pt-0">
                      {saving === country && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                          <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg shadow-lg">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span className="text-xs font-medium">Saving...</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={`visa-${country}`}
                            checked={visaReq}
                            onCheckedChange={(checked) =>
                              updateRequirement(country, 'visa_required', checked as boolean)
                            }
                            disabled={saving === country}
                            className="h-4 w-4 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <label
                            htmlFor={`visa-${country}`}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            Visa Required
                          </label>
                        </div>

                        <div className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={`eta-${country}`}
                            checked={etaReq}
                            onCheckedChange={(checked) =>
                              updateRequirement(country, 'eta_required', checked as boolean)
                            }
                            disabled={saving === country}
                            className="h-4 w-4 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                          />
                          <label
                            htmlFor={`eta-${country}`}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            eTA Required
                          </label>
                        </div>

                        <Separator />

                        <div className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={`passport-${country}`}
                            checked={getRequirementValue(country, 'passport_required')}
                            onCheckedChange={(checked) =>
                              updateRequirement(country, 'passport_required', checked as boolean)
                            }
                            disabled={saving === country}
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`passport-${country}`}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex items-center gap-1.5"
                          >
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            Passport
                          </label>
                        </div>

                        <div className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={`ticket-${country}`}
                            checked={getRequirementValue(country, 'flight_ticket_required')}
                            onCheckedChange={(checked) =>
                              updateRequirement(country, 'flight_ticket_required', checked as boolean)
                            }
                            disabled={saving === country}
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`ticket-${country}`}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex items-center gap-1.5"
                          >
                            <Plane className="h-3 w-3 text-muted-foreground" />
                            Flight Ticket
                          </label>
                        </div>
                        
                        {/* Additional Requirements Section */}
                        {(requirements[country]?.additional_requirements?.length > 0 || editingAdditional === country) && (
                          <>
                            <Separator className="my-3" />
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                  <Plus className="h-3 w-3 text-blue-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">Additional Requirements</span>
                              </div>

                              {/* Existing Additional Requirements */}
                              {requirements[country]?.additional_requirements?.map((req, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:border-blue-300 transition-all group">
                                  <Checkbox
                                    checked={req.required}
                                    onCheckedChange={() => toggleAdditionalRequirement(country, index)}
                                    disabled={saving === country}
                                    className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-gray-800 truncate">{req.name}</div>
                                    {req.description && (
                                      <div className="text-[10px] text-gray-500 truncate mt-0.5">{req.description}</div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAdditionalRequirement(country, index)}
                                    disabled={saving === country}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}

                              {/* Add New Requirement Form */}
                              {editingAdditional === country && (
                                <div className="space-y-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
                                  <div>
                                    <label className="text-[10px] font-semibold text-blue-700 mb-1 block">Requirement Name *</label>
                                    <Input
                                      placeholder="e.g., Yellow Fever Vaccination"
                                      value={newRequirement.name}
                                      onChange={(e) => setNewRequirement(prev => ({ ...prev, name: e.target.value }))}
                                      className="h-8 text-xs border-2 border-blue-200 focus:border-blue-400 focus:ring-blue-100"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-blue-700 mb-1 block">Description (Optional)</label>
                                    <Input
                                      placeholder="Additional details about this requirement"
                                      value={newRequirement.description}
                                      onChange={(e) => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
                                      className="h-8 text-xs border-2 border-blue-200 focus:border-blue-400 focus:ring-blue-100"
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      onClick={() => addAdditionalRequirement(country)}
                                      disabled={!newRequirement.name.trim() || saving === country}
                                      className="h-7 text-xs px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                                    >
                                      <Plus className="h-3 w-3 sm:mr-1" />
                                      <span className="hidden xs:inline">Add Requirement</span>
                                      <span className="xs:hidden">Add</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingAdditional(null);
                                        setNewRequirement({ name: "", description: "" });
                                      }}
                                      className="h-7 text-xs px-2 sm:px-3 border-2 hover:bg-gray-100"
                                    >
                                      <X className="h-3 w-3 sm:mr-1" />
                                      <span className="hidden xs:inline">Cancel</span>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Add Additional Requirement Button */}
                        {editingAdditional !== country && (
                          <>
                            <Separator className="my-3" />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAdditional(country)}
                              disabled={saving === country}
                              className="w-full h-auto py-2 text-[11px] sm:text-xs font-semibold border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                              <span className="break-words">Add Custom Requirement</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defaults Selection Modal */}
      {showDefaultsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 w-full max-w-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Configure All Countries</h3>
            <p className="text-sm text-gray-600 mb-6">
              Apply these settings to all {countries.filter(c => c !== tenantCountry).length} countries. This will update existing configurations:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="default-visa"
                  checked={defaultSettings.visa_required}
                  onCheckedChange={(checked) => 
                    setDefaultSettings(prev => ({ ...prev, visa_required: checked as boolean }))
                  }
                  className="h-4 w-4 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <label htmlFor="default-visa" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Visa Required
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="default-eta"
                  checked={defaultSettings.eta_required}
                  onCheckedChange={(checked) => 
                    setDefaultSettings(prev => ({ ...prev, eta_required: checked as boolean }))
                  }
                  className="h-4 w-4 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                />
                <label htmlFor="default-eta" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-rose-600" />
                  eTA Required
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="default-passport"
                  checked={defaultSettings.passport_required}
                  onCheckedChange={(checked) => 
                    setDefaultSettings(prev => ({ ...prev, passport_required: checked as boolean }))
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="default-passport" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  Passport Required
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="default-ticket"
                  checked={defaultSettings.flight_ticket_required}
                  onCheckedChange={(checked) => 
                    setDefaultSettings(prev => ({ ...prev, flight_ticket_required: checked as boolean }))
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="default-ticket" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Plane className="h-4 w-4 text-gray-600" />
                  Flight Ticket Required
                </label>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                onClick={applyToAllCountries}
                disabled={creatingDefaults}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                {creatingDefaults ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Apply to All
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDefaultsModal(false)}
                disabled={creatingDefaults}
                className="flex-1 text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}