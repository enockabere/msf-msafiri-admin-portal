"use client";

import { useState, useEffect } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Car, Save, Eye, EyeOff, CheckCircle2, XCircle, Key, Globe, Link, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface TransportProvider {
  id?: number;
  provider_name: string;
  is_enabled: boolean;
  client_id: string;
  client_secret: string;
  hmac_secret: string;
  api_base_url: string;
  token_url: string;
}

interface TransportSetupProps {
  tenantSlug: string;
}

const TRANSPORT_PROVIDERS = [
  {
    value: "absolute_cabs",
    label: "Absolute Cabs",
    defaultConfig: {
      api_base_url: "https://api.absolutecabs.co.ke",
      token_url: "https://api.absolutecabs.co.ke/oauth/token"
    }
  }
  // Add more providers here in the future
];

export default function TransportSetup({ tenantSlug }: TransportSetupProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("absolute_cabs");
  const [config, setConfig] = useState<TransportProvider>({
    provider_name: "absolute_cabs",
    is_enabled: false,
    client_id: "",
    client_secret: "",
    hmac_secret: "",
    api_base_url: "https://api.absolutecabs.co.ke",
    token_url: "https://api.absolutecabs.co.ke/oauth/token"
  });
  const { apiClient } = useAuthenticatedApi();

  useEffect(() => {
    fetchConfig();
  }, [tenantSlug]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`);
      const tenantId = tenantResponse.id;

      try {
        const response = await apiClient.request<TransportProvider>(
          `/transport-providers/tenant/${tenantId}/provider/${selectedProvider}`
        );
        setConfig({
          ...response,
          client_id: response.client_id || "",
          client_secret: response.client_secret || "",
          hmac_secret: response.hmac_secret || "",
          api_base_url: response.api_base_url || "https://api.absolutecabs.co.ke",
          token_url: response.token_url || "https://api.absolutecabs.co.ke/oauth/token"
        });
        setSelectedProvider(response.provider_name);
      } catch (error: any) {
        if (error.message && !error.message.includes("not found")) {
          throw error;
        }
        // 404 is expected when no config exists yet - silently continue with defaults
      }
    } catch (error: any) {
      // Only show error if it's not a 404 (404 is expected when no config exists)
      if (error.message && !error.message.includes("not found")) {
        console.error("Error fetching config:", error);
        toast({
          title: "Error",
          description: "Failed to load transport configuration",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`);
      const tenantId = tenantResponse.id;

      const configToSave = { ...config, provider_name: selectedProvider };
      
      // Prepare update data - only include secrets if they're not masked
      const updateData: any = {
        is_enabled: configToSave.is_enabled,
        client_id: configToSave.client_id,
        api_base_url: configToSave.api_base_url,
        token_url: configToSave.token_url
      };
      
      // Only include secrets if they're not masked (dots)
      if (configToSave.client_secret && !configToSave.client_secret.includes('•')) {
        updateData.client_secret = configToSave.client_secret;
      }
      if (configToSave.hmac_secret && !configToSave.hmac_secret.includes('•')) {
        updateData.hmac_secret = configToSave.hmac_secret;
      }
      
      if (config.id) {
        // Update existing
        await apiClient.request(
          `/transport-providers/tenant/${tenantId}/provider/${selectedProvider}`,
          {
            method: "PUT",
            body: JSON.stringify(updateData)
          }
        );
      } else {
        // Create new - include all fields
        const response = await apiClient.request<TransportProvider>(
          `/transport-providers/tenant/${tenantId}`,
          {
            method: "POST",
            body: JSON.stringify(configToSave)
          }
        );
        setConfig(response);
      }

      toast({
        title: "Success",
        description: "Transport configuration saved successfully"
      });
      
      // Refresh to get updated masked secrets
      await fetchConfig();
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "Failed to save transport configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm">Loading transport configuration...</span>
        </CardContent>
      </Card>
    );
  }

  const isConfigured = !!config.id;
  const hasValidCredentials = config.client_id && config.client_secret && config.hmac_secret;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Car className="h-5 w-5 text-primary" />
            </div>
            Transport Provider Setup
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure transport providers for booking services
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card className={config.is_enabled ? "border-green-200 bg-green-50/30" : "border-muted"}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.is_enabled ? 'bg-green-100' : 'bg-muted'}`}>
                {config.is_enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-green-700" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  {config.is_enabled ? 'Transport Integration Active' : 'Transport Integration Disabled'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config.is_enabled
                    ? hasValidCredentials
                      ? 'Provider is configured and ready to use'
                      : 'Provider enabled but credentials may be incomplete'
                    : 'Enable to start using transport services'}
                </p>
              </div>
            </div>
            <Badge
              variant={config.is_enabled ? "default" : "secondary"}
              className={config.is_enabled ? "bg-green-600" : ""}
            >
              {config.is_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Provider Configuration
          </CardTitle>
          <CardDescription className="text-xs">
            Select a provider and configure your API credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Car className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold">Provider Selection</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider" className="text-xs font-medium">Transport Provider</Label>
              <Select value={selectedProvider} onValueChange={(value) => {
                setSelectedProvider(value);
                const provider = TRANSPORT_PROVIDERS.find(p => p.value === value);
                if (provider) {
                  setConfig(prev => ({
                    ...prev,
                    provider_name: value,
                    api_base_url: provider.defaultConfig.api_base_url,
                    token_url: provider.defaultConfig.token_url
                  }));
                }
              }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select transport provider" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORT_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value} className="text-sm">
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/30 to-purple-50/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Custom Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                      className={`relative inline-flex h-9 w-20 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 ${
                        config.is_enabled
                          ? 'bg-gradient-to-r from-green-500 to-green-600 focus:ring-green-200 shadow-md shadow-green-200'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400 focus:ring-gray-200 shadow-sm'
                      }`}
                    >
                      <span className="sr-only">Enable transport integration</span>

                      {/* OFF Label */}
                      <span
                        className={`absolute left-1.5 text-[10px] font-bold transition-opacity duration-300 ${
                          config.is_enabled ? 'opacity-0' : 'opacity-100 text-gray-700'
                        }`}
                      >
                        OFF
                      </span>

                      {/* ON Label */}
                      <span
                        className={`absolute right-1.5 text-[10px] font-bold transition-opacity duration-300 ${
                          config.is_enabled ? 'opacity-100 text-white' : 'opacity-0'
                        }`}
                      >
                        ON
                      </span>

                      {/* Toggle Circle */}
                      <span
                        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                          config.is_enabled ? 'translate-x-11' : 'translate-x-1'
                        }`}
                      >
                        {config.is_enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-500" />
                        )}
                      </span>
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold">
                          {TRANSPORT_PROVIDERS.find(p => p.value === selectedProvider)?.label} Integration
                        </h3>
                        {config.is_enabled ? (
                          <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-300 text-gray-700 text-[10px] px-2 py-0.5">
                            <XCircle className="h-2.5 w-2.5 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {config.is_enabled
                          ? 'Transport booking services are currently active and ready to use'
                          : 'Click the toggle switch to enable transport booking services'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {config.is_enabled && (
            <div className="space-y-4">
              {/* API Credentials Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 rounded-lg">
                      <Key className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-semibold">API Credentials</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="h-7 text-xs"
                  >
                    {showSecrets ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                </div>

                <Alert className="bg-purple-50/50 border-purple-200">
                  <Key className="h-3.5 w-3.5 text-purple-600" />
                  <AlertDescription className="text-xs">
                    Configure your {TRANSPORT_PROVIDERS.find(p => p.value === selectedProvider)?.label} API credentials. These will be securely stored and encrypted.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="client_id" className="text-xs font-medium flex items-center gap-1.5">
                      <Key className="h-3 w-3 text-muted-foreground" />
                      Client ID
                    </Label>
                    <Input
                      id="client_id"
                      value={config.client_id || ""}
                      onChange={(e) => setConfig(prev => ({ ...prev, client_id: e.target.value }))}
                      placeholder="Enter client ID"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="client_secret" className="text-xs font-medium flex items-center gap-1.5">
                      <Key className="h-3 w-3 text-muted-foreground" />
                      Client Secret
                    </Label>
                    <div className="relative">
                      <Input
                        id="client_secret"
                        type={showSecrets ? "text" : "password"}
                        value={config.client_secret || ""}
                        onChange={(e) => setConfig(prev => ({ ...prev, client_secret: e.target.value }))}
                        placeholder="Enter client secret"
                        className="h-9 text-sm pr-3"
                      />
                    </div>
                    {config.client_secret && config.client_secret.includes('•') && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5 text-green-600" />
                        Secret configured. Enter new value to update.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hmac_secret" className="text-xs font-medium flex items-center gap-1.5">
                      <Key className="h-3 w-3 text-muted-foreground" />
                      HMAC Secret
                    </Label>
                    <Input
                      id="hmac_secret"
                      type={showSecrets ? "text" : "password"}
                      value={config.hmac_secret || ""}
                      onChange={(e) => setConfig(prev => ({ ...prev, hmac_secret: e.target.value }))}
                      placeholder="Enter HMAC secret"
                      className="h-9 text-sm"
                    />
                    {config.hmac_secret && config.hmac_secret.includes('•') && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5 text-green-600" />
                        Secret configured. Enter new value to update.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* API Configuration Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Globe className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold">API Endpoints</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="api_base_url" className="text-xs font-medium flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      API Base URL
                    </Label>
                    <Input
                      id="api_base_url"
                      value={config.api_base_url || ""}
                      onChange={(e) => setConfig(prev => ({ ...prev, api_base_url: e.target.value }))}
                      placeholder="https://api.absolutecabs.co.ke"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="token_url" className="text-xs font-medium flex items-center gap-1.5">
                      <Link className="h-3 w-3 text-muted-foreground" />
                      OAuth Token URL
                    </Label>
                    <Input
                      id="token_url"
                      value={config.token_url || ""}
                      onChange={(e) => setConfig(prev => ({ ...prev, token_url: e.target.value }))}
                      placeholder="https://api.absolutecabs.co.ke/oauth/token"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Save className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {isConfigured ? 'Update Configuration' : 'Save Configuration'}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {isConfigured
                      ? 'Your transport provider is configured. Save any changes made above.'
                      : 'Save your configuration to activate transport booking services.'}
                  </p>
                </div>
              </div>
              <Button
                onClick={saveConfig}
                disabled={saving}
                className="h-10 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}