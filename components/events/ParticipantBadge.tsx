"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, Download, MapPin, Calendar, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthenticatedApi } from "@/lib/auth";

interface ParticipantBadgeProps {
  participantId: number;
  participantName: string;
  participantEmail: string;
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  eventDetails?: {
    id: number;
    title: string;
    location: string;
    start_date: string;
    end_date: string;
  };
}

interface QRData {
  qr_data_url: string;
  qr_token: string;
}

export default function ParticipantBadge({
  participantId,
  participantName,
  participantEmail,
  tenantSlug,
  isOpen,
  onClose,
  eventDetails: propEventDetails,
}: ParticipantBadgeProps) {
  const [eventDetails] = useState(propEventDetails || null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { apiClient } = useAuthenticatedApi();

  const fetchBadgeData = useCallback(async () => {
    setLoading(true);
    try {
      const qrResponse = await apiClient.request(
        `/participants/${participantId}/qr`,
        { headers: { 'X-Tenant-ID': tenantSlug } }
      );
      setQrData(qrResponse as QRData);
    } catch (error) {
      console.error("Failed to fetch badge data:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, participantId, tenantSlug]);

  useEffect(() => {
    if (isOpen) {
      fetchBadgeData();
    }
  }, [isOpen, fetchBadgeData]);

  const downloadBadge = () => {
    window.print();
  };

  const printBadge = () => {
    const printWindow = window.open('', '_blank');
    const badgeElement = document.getElementById('participant-badge');
    if (printWindow && badgeElement) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Event Badge - ${participantName}</title>
            <style>
              @page { size: 3.4in 5.1in; margin: 0; }
              body { margin: 0; padding: 0; }
              .badge-container { width: 3.4in; height: 5.1in; }
              @media print {
                * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
                .bg-gradient-to-br { background: linear-gradient(to bottom right, #dc2626, #b91c1c, #991b1b) !important; }
                .bg-blue-600 { background-color: #2563eb !important; }
                .bg-white { background-color: #ffffff !important; }
                .bg-gray-300 { background-color: #d1d5db !important; }
              }
            </style>
          </head>
          <body>
            <div class="badge-container">
              ${badgeElement.outerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[90vw] bg-white border-0 shadow-2xl p-0 max-h-[95vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Event Badge
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={printBadge}
                className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadBadge}
                className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>

            </div>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
              <span className="mt-4 text-gray-600 font-medium">
                Loading badge...
              </span>
            </div>
          ) : (
            <div className="p-8 bg-gray-100">
              <div
                id="participant-badge"
                className="bg-white mx-auto print:w-full print:h-full"
                style={{ width: "320px", height: "480px" }}
              >
                {/* Modern Badge Design */}
                <div
                  className="relative h-full bg-white overflow-hidden print:shadow-none"
                  style={{
                    borderRadius: "24px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Decorative Side Dots */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around items-center py-8 z-10">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`left-${i}`}
                        className="w-3 h-3 rounded-full bg-gray-300"
                      ></div>
                    ))}
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-8 flex flex-col justify-around items-center py-8 z-10">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`right-${i}`}
                        className="w-3 h-3 rounded-full bg-gray-300"
                      ></div>
                    ))}
                  </div>

                  {/* Top Section - Red Background */}
                  <div
                    className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 pt-12 pb-16 px-8"
                    style={{ minHeight: "280px" }}
                  >
                    {/* Event Logo/Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-bold text-lg tracking-wide">
                          EVENT
                        </span>
                      </div>
                    </div>

                    {/* Event Title */}
                    <div className="text-center mb-6">
                      <h1 className="text-white text-4xl font-black mb-3 tracking-tight">
                        {eventDetails?.title || "Conference 2025"}
                      </h1>
                      <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{eventDetails?.location || "Event Location"}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-300 text-sm mt-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {eventDetails
                            ? formatDate(eventDetails.start_date)
                            : "Event Date"}
                        </span>
                      </div>
                    </div>

                    {/* QR Code */}
                    {qrData && (
                      <div className="flex justify-center mt-8">
                        <div className="bg-white p-3 rounded-xl shadow-lg">
                          <img
                            src={qrData.qr_data_url}
                            alt="QR Code"
                            className="w-20 h-20"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Section - White Background with Name */}
                  <div
                    className="bg-white px-8 py-6 relative"
                    style={{ minHeight: "200px" }}
                  >
                    {/* Participant Name */}
                    <div className="text-center mb-8">
                      <h2
                        className="text-3xl font-black text-gray-900 leading-tight mb-3"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {participantName}
                      </h2>
                      <p className="text-xs text-gray-500 font-medium break-words px-2">
                        {participantEmail}
                      </p>
                    </div>

                    {/* Bottom Bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white py-4 text-center"
                      style={{
                        borderBottomLeftRadius: "24px",
                        borderBottomRightRadius: "24px",
                      }}
                    >
                      <p className="text-sm font-bold uppercase tracking-widest">
                        Participant
                      </p>
                    </div>
                  </div>

                  {/* Decorative Corner Indicators */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-gray-300 rounded-tl-lg"></div>
                  <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-gray-300 rounded-tr-lg"></div>
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-gray-300 rounded-bl-lg"></div>
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-gray-300 rounded-br-lg"></div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @media print {
          @page {
            size: 3.4in 5.1in;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          #participant-badge,
          #participant-badge * {
            visibility: visible;
          }

          #participant-badge {
            position: absolute;
            left: 0;
            top: 0;
            width: 3.4in !important;
            height: 5.1in !important;
            margin: 0;
            padding: 0;
          }

          #participant-badge > div {
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}