"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, Clock, AlertCircle, X } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

interface PendingInvitation {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
  invited_at?: string;
  expires_at?: string;
  status?: string;
}

export default function PendingInvitations() {
  const { apiClient } = useAuthenticatedApi();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPendingInvitations = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getPendingInvitations();
        setInvitations(data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load pending invitations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPendingInvitations();
  }, [apiClient]);

  const fetchPendingInvitations = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPendingInvitations();
      setInvitations(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load pending invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: number, email: string) => {
    setResendingId(invitationId);
    try {
      await apiClient.resendInvitation(invitationId);
      toast({
        title: "Success",
        description: `Invitation resent to ${email}`,
      });
      
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'success', message: `Invitation resent to ${email} successfully!` }
      }));
      
      fetchPendingInvitations();
    } catch {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
      
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'error', message: 'Failed to resend invitation' }
      }));
    } finally {
      setResendingId(null);
    }
  };

  const handleCancelInvitation = async (invitationId: number, email: string) => {
    const result = await Swal.fire({
      title: 'Cancel Invitation?',
      text: `Are you sure you want to cancel the invitation for ${email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
    });

    if (!result.isConfirmed) return;

    setCancelingId(invitationId);
    try {
      await apiClient.cancelInvitation(invitationId);
      
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      toast({
        title: "Success",
        description: `Invitation to ${email} has been cancelled`,
      });
      
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'success', message: `Invitation to ${email} cancelled successfully!` }
      }));
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshPendingInvitations'));
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
      
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'error', message: 'Failed to cancel invitation' }
      }));
    } finally {
      setCancelingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Pending Invitations
        </h3>
        <p className="text-gray-600">
          All super admin invitations have been accepted or expired.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          onClick={fetchPendingInvitations}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {invitations.map((invitation) => {
          const expired = isExpired(invitation.expires_at);
          return (
            <div
              key={invitation.id}
              className={`border rounded-lg p-4 ${
                expired ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {invitation.full_name}
                      </h4>
                      <p className="text-sm text-gray-600">{invitation.email}</p>
                    </div>
                    {expired && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Expired</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Sent: {formatDate(invitation.invited_at || invitation.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Expires: {formatDate(invitation.expires_at || '')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      handleResendInvitation(invitation.id, invitation.email)
                    }
                    disabled={resendingId === invitation.id || cancelingId === invitation.id}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {resendingId === invitation.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Resend
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() =>
                      handleCancelInvitation(invitation.id, invitation.email)
                    }
                    disabled={cancelingId === invitation.id || resendingId === invitation.id}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {cancelingId === invitation.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}