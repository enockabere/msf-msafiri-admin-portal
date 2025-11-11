"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  User,
  Wine,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Scan,
  RefreshCw,
} from "lucide-react";

interface ParticipantBalance {
  participant_id: number;
  participant_name: string;
  participant_email: string;
  allocated_vouchers: number;
  redeemed_vouchers: number;
  remaining_vouchers: number;
  is_over_redeemed: boolean;
  over_redemption_count: number;
}

export default function VoucherScannerPage() {
  const [participantId, setParticipantId] = useState("");
  const [eventId, setEventId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [participantBalance, setParticipantBalance] =
    useState<ParticipantBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    // Get tenant and event from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const eventIdParam = urlParams.get("event_id");
    const tenantIdParam = urlParams.get("tenant_id");

    if (eventIdParam) setEventId(eventIdParam);
    if (tenantIdParam) setTenantId(tenantIdParam);
  }, []);

  const fetchParticipantBalance = async (participantIdToCheck: string) => {
    if (!participantIdToCheck || !eventId || !tenantId) {
      return;
    }

    setLoading(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(
        `/api/voucher-redemptions/participant/${participantIdToCheck}/balance?event_id=${eventId}&tenant_id=${tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setParticipantBalance(data);
      } else {
        setParticipantBalance(null);
      }
    } catch {
      setParticipantBalance(null);
    } finally {
      setLoading(false);
    }
  };

  const redeemVoucher = async () => {
    if (!participantBalance || !eventId || !tenantId) return;

    setRedeeming(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(
        `/api/voucher-redemptions/redeem?event_id=${eventId}&tenant_id=${tenantId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participant_id: participantBalance.participant_id,
            quantity: 1,
            location: "Event Venue",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.is_over_redemption) {
        }

        // Refresh balance
        await fetchParticipantBalance(
          participantBalance.participant_id.toString()
        );
      } else {
        const errorData = await response.json();
        console.error("Error redeeming voucher:", errorData);
      }
    } catch {
    } finally {
      setRedeeming(false);
    }
  };

  const handleScan = () => {
    if (participantId) {
      fetchParticipantBalance(participantId);
    }
  };

  const getStatusColor = (balance: ParticipantBalance) => {
    if (balance.is_over_redeemed)
      return "bg-red-100 text-red-800 border-red-200";
    if (balance.remaining_vouchers === 0)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusIcon = (balance: ParticipantBalance) => {
    if (balance.is_over_redeemed) return <XCircle className="h-4 w-4" />;
    if (balance.remaining_vouchers === 0)
      return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Wine className="h-6 w-6 text-purple-600" />
              Voucher Scanner
            </CardTitle>
            <p className="text-sm text-gray-600">
              Scan participant QR codes to redeem vouchers
            </p>
          </CardHeader>
        </Card>

        {/* Scanner Input */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Participant ID
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  placeholder="Enter participant ID"
                  className="flex-1"
                />
                <Button
                  onClick={handleScan}
                  disabled={loading || !participantId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // In a real app, this would open camera for QR scanning
                }}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Participant Balance */}
        {participantBalance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Participant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium">
                  {participantBalance.participant_name}
                </div>
                <div className="text-sm text-gray-600">
                  {participantBalance.participant_email}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {participantBalance.allocated_vouchers}
                  </div>
                  <div className="text-xs text-blue-600">Allocated</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {participantBalance.redeemed_vouchers}
                  </div>
                  <div className="text-xs text-gray-600">Used</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.max(0, participantBalance.remaining_vouchers)}
                  </div>
                  <div className="text-xs text-green-600">Remaining</div>
                </div>
              </div>

              <div className="flex justify-center">
                <Badge
                  className={`${getStatusColor(
                    participantBalance
                  )} flex items-center gap-1`}
                >
                  {getStatusIcon(participantBalance)}
                  {participantBalance.is_over_redeemed
                    ? `Over-redeemed by ${participantBalance.over_redemption_count}`
                    : participantBalance.remaining_vouchers === 0
                    ? "Fully Used"
                    : "Active"}
                </Badge>
              </div>

              {participantBalance.is_over_redeemed && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Over-redemption Alert</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    This participant has redeemed{" "}
                    {participantBalance.over_redemption_count} more vouchers
                    than allocated.
                  </p>
                </div>
              )}

              <Button
                onClick={redeemVoucher}
                disabled={redeeming}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {redeeming ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wine className="h-4 w-4 mr-2" />
                )}
                Redeem 1 Voucher
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">How to use:</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Enter participant ID or scan QR code</li>
              <li>2. Review participant&apos;s voucher balance</li>
              <li>3. Click &quot;Redeem 1 Voucher&quot; to process</li>
              <li>4. Watch for over-redemption warnings</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
