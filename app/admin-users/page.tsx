"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, MoreHorizontal, UserCheck, UserX, Search, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  is_active: boolean;
  tenant_id?: string;
  created_at: string;
  last_login?: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersData = await apiClient.request<AdminUser[]>("/users/", {
        headers: user?.tenantId ? { "X-Tenant-ID": user.tenantId } : {},
      });
      
      // Filter for admin users only
      const adminUsers = usersData.filter(u => 
        u.role.includes("ADMIN") || u.role.includes("admin")
      );
      
      setUsers(adminUsers);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, user?.tenantId]);

  useEffect(() => {
    if (!authLoading && user?.email) {
      fetchUsers();
    }
  }, [user?.email, authLoading, fetchUsers]);

  const handleActivateUser = async (userId: number) => {
    try {
      setActionLoading(`activate-${userId}`);
      await apiClient.request(`/users/activate/${userId}`, {
        method: "POST",
      });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: true, status: "ACTIVE" } : u
      ));
      
      toast({
        title: "Success",
        description: "User activated successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to activate user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    try {
      setActionLoading(`deactivate-${userId}`);
      await apiClient.request(`/users/deactivate/${userId}`, {
        method: "POST",
      });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: false, status: "INACTIVE" } : u
      ));
      
      toast({
        title: "Success",
        description: "User deactivated successfully",
      });
    } catch  {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800";
      case "MT_ADMIN":
        return "bg-yellow-100 text-yellow-800";
      case "HR_ADMIN":
        return "bg-orange-100 text-orange-800";
      case "EVENT_ADMIN":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute requireTenantAdmin={true}>
      <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
            <p className="text-gray-600">Manage administrative users in your organization</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Administrative Users
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No admin users found</h3>
                <p className="text-gray-600">No administrative users match your search criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((adminUser) => (
                    <TableRow key={adminUser.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{adminUser.full_name}</div>
                          <div className="text-sm text-gray-500">{adminUser.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(adminUser.role)}>
                          {adminUser.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={adminUser.is_active ? "default" : "secondary"}
                          className={
                            adminUser.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {adminUser.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {adminUser.last_login
                          ? new Date(adminUser.last_login).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {new Date(adminUser.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {adminUser.is_active ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivateUser(adminUser.id)}
                                disabled={actionLoading === `deactivate-${adminUser.id}`}
                                className="text-red-600"
                              >
                                {actionLoading === `deactivate-${adminUser.id}` ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <UserX className="w-4 h-4 mr-2" />
                                )}
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleActivateUser(adminUser.id)}
                                disabled={actionLoading === `activate-${adminUser.id}`}
                                className="text-green-600"
                              >
                                {actionLoading === `activate-${adminUser.id}` ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <UserCheck className="w-4 h-4 mr-2" />
                                )}
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}