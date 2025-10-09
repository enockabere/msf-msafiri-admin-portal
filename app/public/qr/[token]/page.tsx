"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { User, Calendar, MapPin, Clock, Coffee, CheckCircle } from "lucide-react";

interface QRData {
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

export default function PublicQRScanPage() {
  const params = useParams();
  const token = params.token as string;
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQRData = async () => {
      try {
        console.warn('Fetching QR data for token:', token);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/qr/${token}/participant`);
        console.warn('QR scan response:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.warn('QR data received:', data);
          setQrData(data);
        } else {
          const errorText = await response.text();
          console.error('QR scan failed:', response.status, errorText);
          setError(`Invalid or expired QR code (${response.status})`);
        }
      } catch (error) {
        console.error('QR scan error:', error);
        setError("Failed to scan QR code - network error");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchQRData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Scanning QR code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Please ensure you&apos;re scanning a valid event participant QR code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!qrData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{qrData.participant_name}</h1>
                <p className="text-red-100">{qrData.participant_email}</p>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-gray-600 font-medium min-w-20">Event:</div>
                <div className="text-gray-900 font-semibold">{qrData.event_title}</div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <div className="text-gray-600 font-medium min-w-16">Location:</div>
                <div className="text-gray-900">{qrData.event_location}</div>
              </div>
              {qrData.event_start_date && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-gray-500 mt-1" />
                  <div className="text-gray-600 font-medium min-w-16">Duration:</div>
                  <div className="text-gray-900">
                    {new Date(qrData.event_start_date).toLocaleDateString()}
                    {qrData.event_end_date && qrData.event_end_date !== qrData.event_start_date && (
                      <span> - {new Date(qrData.event_end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drink Vouchers */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Drink Vouchers</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{qrData.total_drinks}</div>
                <div className="text-sm text-blue-800">Total Allocated</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{qrData.redeemed_drinks || 0}</div>
                <div className="text-sm text-red-800">Redeemed</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${qrData.remaining_drinks < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {qrData.remaining_drinks}
                </div>
                <div className="text-sm text-green-800">Remaining</div>
              </div>
            </div>
            
            {qrData.remaining_drinks > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    This participant has {qrData.remaining_drinks} voucher{qrData.remaining_drinks !== 1 ? 's' : ''} available for redemption.
                  </span>
                </div>
              </div>
            )}
            
            {qrData.remaining_drinks <= 0 && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 text-gray-500">ℹ️</div>
                  <span className="text-sm font-medium text-gray-700">
                    {qrData.remaining_drinks === 0 ? 'All vouchers have been redeemed.' : 'Over-redeemed by ' + Math.abs(qrData.remaining_drinks) + ' voucher(s).'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <p className="text-xs text-gray-500 text-center">
              This QR code is valid for the duration of the event. Present to staff for voucher redemption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}