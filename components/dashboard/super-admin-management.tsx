"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Mail, Loader2, Shield, Users } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/auth";
import { User } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { SuperAdminTable } from "./super-admin-table";
import { getInternalApiUrl } from "@/lib/base-path";

export default function SuperAdminManagement() {
  const { apiClient } = useAuthenticatedApi();
  const [superAdmins, setSuperAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    full_name: "",
  });

  const fetchSuperAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const users = await apiClient.getSuperAdmins();
      setSuperAdmins(users);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load super admins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSuperAdmins();
  }, [fetchSuperAdmins]);



  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(-1);

    try {
      await apiClient.inviteSuperAdmin(inviteForm.email, inviteForm.full_name);

      // Send notification to all super admins about new invitation
      try {

        const notifResponse = await fetch(getInternalApiUrl('/api/notifications/send-to-super-admins'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: "New Super Admin Invited",
            message: `${inviteForm.full_name} (${inviteForm.email}) has been invited as a super admin`,
            priority: "MEDIUM"
          }),
        });
        
        if (notifResponse.ok) {
          await notifResponse.json();
        } else {
          await notifResponse.json();
        }
      } catch {
      }

      toast({
        title: "Success",
        description:
          "Super admin invitation sent successfully. They will receive an email with login details.",
      });
      
      // Trigger notification event for dashboard
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'success', message: 'Super admin invitation sent successfully!' }
      }));
      
      setShowInviteModal(false);
      setInviteForm({ email: "", full_name: "" });
      fetchSuperAdmins();
      
      // Refresh pending invitations count and notifications

      window.dispatchEvent(new CustomEvent('refreshPendingInvitations'));
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
      
      // Trigger error notification for dashboard
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'error', message: 'Failed to send invitation' }
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (user: User) => {
    setActionLoading(user.id);
    try {
      await apiClient.removeSuperAdmin(user.id);

      toast({
        title: "Success",
        description: `Super admin role removed from ${user.full_name}. They can now be re-invited if needed.`,
      });

      // Trigger notification event for dashboard
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'success', message: `Super admin role removed from ${user.full_name}` }
      }));

      fetchSuperAdmins();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove super admin role",
        variant: "destructive",
      });

      // Trigger error notification for dashboard
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type: 'error', message: 'Failed to remove super admin role' }
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = superAdmins.filter((admin) => admin.is_active).length;
  const totalCount = superAdmins.length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-200">
              <Shield className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Super Admin Management
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Manage system administrators and permissions
              </p>
            </div>
          </div>
        </div>

        {/* Stats & Action */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                {activeCount}/{totalCount} Active
              </span>
            </div>
          </div>

          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Admin
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <SuperAdminTable
          data={superAdmins}
          loading={loading}
          onEdit={() => {}}
          onActivate={() => {}}
          onDeactivate={() => {}}
          onResendInvite={() => {}}
          onRemove={handleRemove}
        />
      </div>

      {/* Enhanced Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-200">
                <UserPlus className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Invite Super Admin
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Send an invitation to a new system administrator
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label
                htmlFor="full_name"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </Label>
              <Input
                id="full_name"
                placeholder="Enter full name"
                value={inviteForm.full_name}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, full_name: e.target.value })
                }
                required
                disabled={actionLoading === -1}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                required
                disabled={actionLoading === -1}
                className="h-10"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 font-medium">
                The invited user will receive an email with login credentials
                and setup instructions.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                disabled={actionLoading === -1}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading === -1}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                size="sm"
              >
                {actionLoading === -1 ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
