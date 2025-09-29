"use client";

import { useState, useEffect, useCallback } from "react";
import { QrCode, User, Calendar, Package, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthenticatedApi } from "@/lib/auth";

interface ParticipantQRCodeProps {
  participantId: number;
  participantName: string;
  eventId: number;
  tenantSlug: string;
}



interface QRAllocationData {
  participant_id: number;
  participant_name: string;
  participant_email: string;
  event_id: number;
  event_title: string;
  event_location: string;
  event_start_date?: string;
  event_end_date?: string;
  total_drinks: number;
  remaining_drinks: number;
  redeemed_drinks?: number;
}

interface ParticipantQRResponse {
  qr_token: string;
  qr_data_url: string;
  allocation_summary: QRAllocationData;
}

export default function ParticipantQRCode({
  participantId,

  tenantSlug,
}: ParticipantQRCodeProps) {
  const [qrData, setQrData] = useState<ParticipantQRResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { apiClient } = useAuthenticatedApi();

  const fetchQRCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.request(
        `/participants/${participantId}/qr`,
        { headers: { 'X-Tenant-ID': tenantSlug } }
      );
      setQrData(response as ParticipantQRResponse);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  }, [participantId, apiClient, tenantSlug]);

  useEffect(() => {
    fetchQRCode();
  }, [fetchQRCode]);



  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Generating QR code...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-4">
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">{error}</div>
          <Button onClick={fetchQRCode} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!qrData) {
    return null;
  }

  const { allocation_summary } = qrData;

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="h-5 w-5 text-red-600" />
          <h4 className="font-semibold text-gray-900">Participant QR Code</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={qrData.qr_data_url} 
                alt="Participant QR Code"
                className="w-48 h-48"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">QR Token</p>
              <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {qrData.qr_token.substring(0, 8)}...
              </p>
            </div>
          </div>

          {/* Participant Info & Allocations */}
          <div className="space-y-4">
            {/* Participant Details */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">Participant Details</span>
              </div>
              <div className="space-y-1 text-xs">
                <div><span className="text-gray-600">Name:</span> <span className="font-medium">{allocation_summary.participant_name}</span></div>
                <div><span className="text-gray-600">Email:</span> <span className="font-medium">{allocation_summary.participant_email}</span></div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">Event Details</span>
              </div>
              <div className="space-y-1 text-xs">
                <div><span className="text-gray-600">Event:</span> <span className="font-medium">{allocation_summary.event_title}</span></div>
                <div><span className="text-gray-600">Location:</span> <span className="font-medium">{allocation_summary.event_location}</span></div>
                {allocation_summary.event_start_date && (
                  <div><span className="text-gray-600">Start:</span> <span className="font-medium">{new Date(allocation_summary.event_start_date).toLocaleDateString()}</span></div>
                )}
                {allocation_summary.event_end_date && (
                  <div><span className="text-gray-600">End:</span> <span className="font-medium">{new Date(allocation_summary.event_end_date).toLocaleDateString()}</span></div>
                )}
              </div>
            </div>

            {/* Drink Vouchers */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">Drink Vouchers</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="text-center p-1 bg-white rounded">
                  <div className="font-medium text-blue-600">{allocation_summary.total_drinks}</div>
                  <div className="text-gray-600">Assigned</div>
                </div>
                <div className="text-center p-1 bg-white rounded">
                  <div className="font-medium text-red-600">{allocation_summary.redeemed_drinks || 0}</div>
                  <div className="text-gray-600">Redeemed</div>
                </div>
                <div className="text-center p-1 bg-white rounded">
                  <div className={`font-medium ${allocation_summary.remaining_drinks < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {allocation_summary.remaining_drinks}
                  </div>
                  <div className="text-gray-600">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-4 text-center">
          <Button onClick={fetchQRCode} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh QR Code
          </Button>
        </div>
      </div>
    </div>
  );
}