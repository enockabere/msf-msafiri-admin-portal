"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Package, Calendar } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading";

interface AllocationItem {
  inventory_item_id: number;
  quantity_per_participant: number;
  inventory_item_name: string;
  available_quantity: number;
}

interface PendingAllocation {
  id: number;
  event_id: number;
  event_title: string;
  event_date: string;
  items: AllocationItem[];
  drink_vouchers_per_participant: number;
  status: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export default function AllocationApprovalsPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [allocations, setAllocations] = useState<PendingAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<PendingAllocation | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tenantSlug = params.slug as string;

  const fetchPendingAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<PendingAllocation[]>(`/allocations/pending/${tenantSlug}`);
      setAllocations(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending allocations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug]);

  useEffect(() => {
    if (!authLoading && user?.email) {
      fetchPendingAllocations();
    }
  }, [user?.email, authLoading, fetchPendingAllocations]);

  const handleAction = (allocation: PendingAllocation, action: 'approve' | 'reject') => {
    setSelectedAllocation(allocation);
    setActionType(action);
    setComment("");
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (!selectedAllocation) return;
    
    if (actionType === 'reject' && !comment.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const endpoint = actionType === 'approve' 
        ? `/allocations/${selectedAllocation.id}/approve`
        : `/allocations/${selectedAllocation.id}/reject`;
      
      const params = new URLSearchParams({
        approved_by: user?.email || '',
        comment: comment.trim()
      });

      await apiClient.request(`${endpoint}?${params}`, {
        method: 'PUT',
      });
      
      setShowActionModal(false);
      await fetchPendingAllocations();
      
      toast({
        title: "Success",
        description: `Allocation ${actionType}d successfully`,
      });
    } catch (error) {
      console.error(`${actionType} error:`, error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} allocation`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Loading allocation approvals..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Allocation Approvals</h1>
              <p className="text-gray-600">Review and approve resource allocation requests</p>
            </div>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              <Clock className="w-4 h-4 mr-1" />
              {allocations.length} Pending
            </Badge>
          </div>

          <div className="space-y-4">
            {allocations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
                  <p className="text-gray-600 text-center">
                    All allocation requests have been processed
                  </p>
                </CardContent>
              </Card>
            ) : (
              allocations.map((allocation) => (
                <Card key={allocation.id} className="shadow-md hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                          <Package className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{allocation.event_title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {allocation.event_date ? new Date(allocation.event_date).toLocaleDateString() : 'No date'}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        Pending Approval
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Requested Items:</h4>
                      <div className="space-y-2">
                        {allocation.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium">{item.inventory_item_name}</span>
                              <div className="text-sm text-gray-600">
                                Available: {item.available_quantity}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {item.quantity_per_participant} per participant
                            </Badge>
                          </div>
                        ))}
                        {allocation.drink_vouchers_per_participant > 0 && (
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">Drink Vouchers</span>
                            <Badge variant="outline">
                              {allocation.drink_vouchers_per_participant} per participant
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {allocation.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {allocation.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Requested by: <span className="font-medium">{allocation.created_by}</span>
                        <br />
                        {new Date(allocation.created_at).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(allocation, 'reject')}
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleAction(allocation, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent className="max-w-md bg-white border shadow-lg">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve' : 'Reject'} Allocation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                {actionType === 'approve' 
                  ? 'Are you sure you want to approve this allocation request?'
                  : 'Please provide a reason for rejecting this allocation request.'
                }
              </p>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {actionType === 'approve' ? 'Comment (optional)' : 'Rejection Reason *'}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={actionType === 'approve' 
                    ? 'Add any comments...'
                    : 'Explain why this request is being rejected...'
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowActionModal(false)}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitAction} 
                disabled={submitting}
                className={`px-6 py-2 font-medium shadow-sm ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {submitting ? `${actionType === 'approve' ? 'Approving' : 'Rejecting'}...` : 
                  `${actionType === 'approve' ? 'Approve' : 'Reject'}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}