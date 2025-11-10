"use client";

import { useState } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { QrCode, CheckCircle, XCircle, User, Calendar, Package } from "lucide-react";

interface RedemptionDetails {
  token: string;
  participant_name: string;
  participant_email: string;
  event_title: string;
  quantity: number;
  notes?: string;
  created_at: string;
  total_vouchers: number;
}

export default function VoucherScannerPage() {
  const { apiClient } = useAuthenticatedApi();
  const [scanInput, setScanInput] = useState("");
  const [redemptionDetails, setRedemptionDetails] = useState<RedemptionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleScan = async () => {
    if (!scanInput.trim()) {
      toast({ title: "Error", description: "Please enter a redemption token", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let token = scanInput.trim();
      if (token.includes("msafiri://redeem/")) {
        token = token.split("msafiri://redeem/")[1];
      }

      const response = await apiClient.request(`/mobile-allocations/admin/scan-redemption/${token}`);
      setRedemptionDetails(response);
    } catch (error: any) {
      toast({ 
        title: "Scan Failed", 
        description: error.message || "Invalid or expired redemption code", 
        variant: "destructive" 
      });
      setRedemptionDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRedemption = async () => {
    if (!redemptionDetails) return;

    setConfirming(true);
    try {
      await apiClient.request(`/mobile-allocations/admin/confirm-redemption/${redemptionDetails.token}`, {
        method: 'POST'
      });

      toast({ 
        title: "Redemption Confirmed", 
        description: `Successfully redeemed ${redemptionDetails.quantity} voucher(s) for ${redemptionDetails.participant_name}` 
      });

      setScanInput("");
      setRedemptionDetails(null);
    } catch (error: any) {
      toast({ 
        title: "Confirmation Failed", 
        description: error.message || "Failed to confirm redemption", 
        variant: "destructive" 
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <QrCode className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Voucher Scanner</h1>
              <p className="text-sm text-gray-600">Scan participant QR codes to confirm drink voucher redemptions</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-600" />
              Scan Redemption Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Scan QR code or enter redemption token..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                className="flex-1"
                autoFocus
              />
              <Button 
                onClick={handleScan} 
                disabled={loading || !scanInput.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? "Scanning..." : "Scan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {redemptionDetails && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                Redemption Request Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Participant Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium ml-2">{redemptionDetails.participant_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium ml-2">{redemptionDetails.participant_email}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Voucher Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{redemptionDetails.quantity}</div>
                    <div className="text-sm text-gray-600">Requesting</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{redemptionDetails.total_vouchers}</div>
                    <div className="text-sm text-gray-600">Total Allocated</div>
                  </div>
                </div>
                {redemptionDetails.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Notes:</div>
                    <div className="text-sm font-medium">{redemptionDetails.notes}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setScanInput("");
                    setRedemptionDetails(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmRedemption}
                  disabled={confirming}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {confirming ? "Confirming..." : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Redemption
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}