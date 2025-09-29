"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EventDetails {
  title?: string;
  location?: string;
}

interface TransportDetails {
  booking_type: string;
  status: string;
  pickup_locations: string[];
  destination: string;
  scheduled_time: string;
  driver_name?: string;
  vehicle_details?: string;
}

interface AccommodationDetails {
  name: string;
  type: string;
  location: string;
  status?: string;
  check_in_date?: string;
  check_out_date?: string;
}

interface VoucherSummary {
  total_drinks: number;
  redeemed_drinks?: number;
  remaining_drinks: number;
}

interface ParticipantPDFReportProps {
  participantId: number;
  participantName: string;
  participantEmail: string;
  eventDetails: EventDetails;
  transportDetails: TransportDetails[];
  accommodationDetails: AccommodationDetails[];
  voucherSummary: VoucherSummary;
  isOpen: boolean;
  onClose: () => void;
}

export default function ParticipantPDFReport({
  participantName,
  participantEmail,
  eventDetails,
  transportDetails,
  accommodationDetails,
  voucherSummary,
  isOpen,
  onClose,
}: ParticipantPDFReportProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      // Create a new window with the report content
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(getReportHTML());
        reportWindow.document.close();
        
        // Wait for content to load then print
        setTimeout(() => {
          reportWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Participant Report - ${participantName}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
          }
          
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          
          .participant-info {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
          }
          
          .participant-info h2 {
            color: #dc2626;
            margin-top: 0;
            font-size: 22px;
            border-bottom: 2px solid #dc2626;
            padding-bottom: 10px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .info-value {
            font-size: 16px;
            color: #1e293b;
          }
          
          .section {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .section h3 {
            color: #dc2626;
            margin-top: 0;
            font-size: 20px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
          }
          
          .transport-item, .accommodation-item {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #dc2626;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-confirmed {
            background: #dcfce7;
            color: #166534;
          }
          
          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }
          
          .voucher-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
          }
          
          .voucher-card {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
          }
          
          .voucher-card.assigned {
            background: #dbeafe;
            border-color: #3b82f6;
          }
          
          .voucher-card.redeemed {
            background: #fee2e2;
            border-color: #ef4444;
          }
          
          .voucher-card.remaining {
            background: #dcfce7;
            border-color: #22c55e;
          }
          
          .voucher-number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .voucher-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
          }
          
          .no-data {
            text-align: center;
            color: #64748b;
            font-style: italic;
            padding: 30px;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Participant Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <div class="participant-info">
          <h2>Participant Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Full Name</span>
              <span class="info-value">${participantName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email Address</span>
              <span class="info-value">${participantEmail}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Event</span>
              <span class="info-value">${eventDetails?.title || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Event Location</span>
              <span class="info-value">${eventDetails?.location || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>🚗 Transport Arrangements</h3>
          ${transportDetails.length > 0 ? transportDetails.map(transport => `
            <div class="transport-item">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <strong>${transport.booking_type.replace('_', ' ').toUpperCase()}</strong>
                <span class="status-badge status-${transport.status.toLowerCase()}">${transport.status}</span>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Route</span>
                  <span class="info-value">${transport.pickup_locations.join(', ')} → ${transport.destination}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Schedule</span>
                  <span class="info-value">${formatDate(transport.scheduled_time)}</span>
                </div>
                ${transport.driver_name ? `
                <div class="info-item">
                  <span class="info-label">Driver</span>
                  <span class="info-value">${transport.driver_name}</span>
                </div>
                ` : ''}
                ${transport.vehicle_details ? `
                <div class="info-item">
                  <span class="info-label">Vehicle</span>
                  <span class="info-value">${transport.vehicle_details}</span>
                </div>
                ` : ''}
              </div>
            </div>
          `).join('') : '<div class="no-data">No transport arrangements</div>'}
        </div>

        <div class="section">
          <h3>🏨 Accommodation Details</h3>
          ${accommodationDetails.length > 0 ? accommodationDetails.map((accommodation) => `
            <div class="accommodation-item">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <strong>${accommodation.name}</strong>
                <span class="status-badge status-${accommodation.status?.toLowerCase() || 'confirmed'}">${accommodation.status || 'Confirmed'}</span>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Type</span>
                  <span class="info-value">${accommodation.type.toUpperCase()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Location</span>
                  <span class="info-value">${accommodation.location}</span>
                </div>
                ${accommodation.check_in_date ? `
                <div class="info-item">
                  <span class="info-label">Check-in</span>
                  <span class="info-value">${formatDate(accommodation.check_in_date)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Check-out</span>
                  <span class="info-value">${accommodation.check_out_date ? formatDate(accommodation.check_out_date) : 'TBD'}</span>
                </div>
                ` : ''}
              </div>
            </div>
          `).join('') : '<div class="no-data">No accommodation arrangements</div>'}
        </div>

        <div class="section">
          <h3>🍺 Drink Vouchers</h3>
          ${voucherSummary && voucherSummary.total_drinks > 0 ? `
            <div class="voucher-stats">
              <div class="voucher-card assigned">
                <div class="voucher-number" style="color: #3b82f6;">${voucherSummary.total_drinks}</div>
                <div class="voucher-label">Total Assigned</div>
              </div>
              <div class="voucher-card redeemed">
                <div class="voucher-number" style="color: #ef4444;">${voucherSummary.redeemed_drinks || 0}</div>
                <div class="voucher-label">Redeemed</div>
              </div>
              <div class="voucher-card remaining">
                <div class="voucher-number" style="color: ${voucherSummary.remaining_drinks < 0 ? '#ef4444' : '#22c55e'};">${voucherSummary.remaining_drinks}</div>
                <div class="voucher-label">Remaining</div>
              </div>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
              <strong>Utilization Rate:</strong> ${Math.round(((voucherSummary.redeemed_drinks || 0) / voucherSummary.total_drinks) * 100)}%
            </div>
          ` : '<div class="no-data">No drink vouchers allocated</div>'}
        </div>

        <div class="footer">
          <p>This report was generated automatically by the Event Management System</p>
          <p>For questions or concerns, please contact the event organizers</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            Generate PDF Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Participant Report</h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate a comprehensive PDF report for {participantName}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Report includes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Participant information</li>
              <li>• Transport arrangements</li>
              <li>• Accommodation details</li>
              <li>• Drink voucher summary</li>
              <li>• Event information</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              onClick={generatePDF}
              disabled={generating}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}