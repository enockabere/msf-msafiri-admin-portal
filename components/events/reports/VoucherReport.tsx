"use client";

import { Package, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VoucherSummary {
  total_drinks: number;
  remaining_drinks: number;
  redeemed_drinks: number;
}

interface VoucherReportProps {
  voucherSummary: VoucherSummary | null;
  participantName: string;
  canManageEvents?: boolean;
  onRedeem?: () => void;
  onEdit?: () => void;
}

export default function VoucherReport({ 
  voucherSummary, 
  participantName, 
  canManageEvents = false,
  onRedeem,
  onEdit
}: VoucherReportProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 text-red-600">🍺</div>
          <h3 className="text-lg font-semibold text-gray-900">Drink Vouchers Report</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Voucher allocation and usage for {participantName}</p>
      </div>

      <div className="p-4">
        {voucherSummary && voucherSummary.total_drinks > 0 ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{voucherSummary.total_drinks}</div>
                <div className="text-sm text-gray-600">Total Assigned</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{voucherSummary.redeemed_drinks || 0}</div>
                <div className="text-sm text-gray-600">Redeemed</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${voucherSummary.remaining_drinks < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {voucherSummary.remaining_drinks}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Voucher Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Utilization Rate:</span>
                  <span className="text-sm font-medium">
                    {Math.round(((voucherSummary.redeemed_drinks || 0) / voucherSummary.total_drinks) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="outline" className={`text-xs ${
                    voucherSummary.remaining_drinks < 0 
                      ? 'bg-red-100 text-red-800' 
                      : voucherSummary.remaining_drinks === 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {voucherSummary.remaining_drinks < 0 
                      ? `Over-redeemed by ${Math.abs(voucherSummary.remaining_drinks)}`
                      : voucherSummary.remaining_drinks === 0 
                        ? 'Fully Utilized'
                        : 'Available'
                    }
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {canManageEvents && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRedeem}
                  className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Redeem Vouchers
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEdit}
                  className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Edit Vouchers
                </Button>
              </div>
            )}

            {/* Usage History Placeholder */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
              <div className="text-center py-4">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Detailed usage history coming soon</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-3">🍺</div>
            <p className="text-gray-500">No drink vouchers allocated</p>
          </div>
        )}
      </div>
    </div>
  );
}