"use client";

import { useState, useEffect } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Car, Save, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default function TransportSetup({ tenantSlug }: TransportSetupProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
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
          `/transport-providers/tenant/${tenantId}/provider/absolute_cabs`
        );
        setConfig(response);
      } catch (error: any) {
        if (error.status === 404) {
          // Provider not configured yet, keep defaults
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast({
        title: "Error",
        description: "Failed to load transport configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      
      const tenantResponse = await apiClient.request(`/tenants/slug/${tenantSlug}`);
      const tenantId = tenantResponse.id;

      if (config.id) {
        // Update existing
        await apiClient.request(
          `/transport-providers/tenant/${tenantId}/provider/absolute_cabs`,
          {
            method: "PUT",
            body: JSON.stringify({
              is_enabled: config.is_enabled,
              client_id: config.client_id,
              client_secret: config.client_secret,
              hmac_secret: config.hmac_secret,
              api_base_url: config.api_base_url,
              token_url: config.token_url
            })
          }
        );
      } else {
        // Create new
        const response = await apiClient.request<TransportProvider>(
          `/transport-providers/tenant/${tenantId}`,
          {
            method: "POST",
            body: JSON.stringify(config)
          }
        );
        setConfig(response);
      }

      toast({
        title: "Success",
        description: "Transport configuration saved successfully"
      });
    } catch (error) {
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
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transport configuration...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Transport Provider Setup
          </CardTitle>
          <CardDescription>
            Configure transport providers for booking services. Currently supporting Absolute Cabs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={config.is_enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_enabled: checked }))}
            />
            <Label htmlFor="enabled">Enable Absolute Cabs Integration</Label>
          </div>

          {config.is_enabled && (
            <div className="space-y-4 border-t pt-4">
              <Alert>
                <AlertDescription>
                  Configure your Absolute Cabs API credentials. These will be securely stored and used for transport bookings.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={config.client_id}
                    onChange={(e) => setConfig(prev => ({ ...prev, client_id: e.target.value }))}
                    placeholder="Enter client ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="client_secret"
                      type={showSecrets ? "text" : "password"}
                      value={config.client_secret}
                      onChange={(e) => setConfig(prev => ({ ...prev, client_secret: e.target.value }))}
                      placeholder="Enter client secret"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hmac_secret">HMAC Secret</Label>
                  <Input
                    id="hmac_secret"
                    type={showSecrets ? "text" : "password"}
                    value={config.hmac_secret}
                    onChange={(e) => setConfig(prev => ({ ...prev, hmac_secret: e.target.value }))}
                    placeholder="Enter HMAC secret"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_base_url">API Base URL</Label>
                  <Input
                    id="api_base_url"
                    value={config.api_base_url}
                    onChange={(e) => setConfig(prev => ({ ...prev, api_base_url: e.target.value }))}
                    placeholder="https://api.absolutecabs.co.ke"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="token_url">Token URL</Label>
                  <Input
                    id="token_url"
                    value={config.token_url}
                    onChange={(e) => setConfig(prev => ({ ...prev, token_url: e.target.value }))}
                    placeholder="https://api.absolutecabs.co.ke/oauth/token"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={saveConfig} disabled={saving}>
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
        </CardContent>
      </Card>
    </div>
  );
}