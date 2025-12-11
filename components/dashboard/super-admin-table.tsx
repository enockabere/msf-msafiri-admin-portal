"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit,
  Power,
  PowerOff,
  Mail,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  Filter,
  Shield,
  Trash2,
} from "lucide-react";
import { User } from "@/lib/api";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface SuperAdminTableProps {
  data: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
  onResendInvite?: (user: User) => void;
  onRemove?: (user: User) => void;
}

export function SuperAdminTable({
  data,
  loading = false,
  onEdit,
  onActivate,
  onDeactivate,
  onResendInvite,
  onRemove,
}: SuperAdminTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof User>("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate" | "remove";
    user: User;
  } | null>(null);

  // Filter data based on search term and status
  const filteredData = data.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    return matchesSearch && matchesStatus;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const activeAdminsCount = data.filter((user) => user.is_active).length;
  const isLastActiveAdmin = (user: User) =>
    user.is_active && activeAdminsCount === 1;

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Status",
      "Last Login",
      "Created",
    ];
    const csvData = [
      headers.join(","),
      ...sortedData.map((user) =>
        [
          `"${user.full_name}"`,
          `"${user.email}"`,
          `"${user.role}"`,
          user.is_active ? "Active" : "Inactive",
          user.last_login
            ? format(new Date(user.last_login), "MMM dd, yyyy")
            : "Never",
          format(new Date(user.created_at), "MMM dd, yyyy"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "super-admins.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "activate") {
      onActivate(confirmAction.user);
    } else if (confirmAction.type === "deactivate") {
      onDeactivate(confirmAction.user);
    } else if (confirmAction.type === "remove" && onRemove) {
      onRemove(confirmAction.user);
    }
    setConfirmAction(null);
  };

  const getSortIcon = (field: keyof User) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1" />
    );
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="w-full space-y-4 p-6">
        {/* Search, Filter and Export Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm border-gray-200"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {statusFilter === "all"
                    ? "All"
                    : statusFilter === "active"
                    ? "Active"
                    : "Inactive"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Admins
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Active Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                  Inactive Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("full_name")}
                  >
                    <div className="flex items-center">
                      Admin
                      {getSortIcon("full_name")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center">
                      Contact
                      {getSortIcon("email")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("is_active")}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon("is_active")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("last_login")}
                  >
                    <div className="flex items-center">
                      Last Active
                      {getSortIcon("last_login")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Joined
                      {getSortIcon("created_at")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <Shield className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          No super admins found
                        </div>
                        <div className="text-xs text-gray-500">
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "Get started by inviting your first admin"}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedData.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-purple-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-violet-700">
                              {user.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          Primary contact
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className="bg-violet-50 text-violet-700 border-violet-200 text-xs font-medium"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Super Admin
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={user.is_active ? "default" : "secondary"}
                          className={`text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {user.last_login ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {format(
                                new Date(user.last_login),
                                "MMM dd, yyyy"
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(user.last_login), "HH:mm")}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            Never logged in
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {format(new Date(user.created_at), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(user.created_at), "HH:mm")}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg rounded-md">
                            <DropdownMenuItem
                              onClick={() => onEdit(user)}
                              className="gap-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Details
                            </DropdownMenuItem>
                            {onResendInvite &&
                              user.status === "PENDING_APPROVAL" && (
                                <DropdownMenuItem
                                  onClick={() => onResendInvite(user)}
                                  className="gap-2 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Mail className="w-4 h-4" />
                                  Resend Invite
                                </DropdownMenuItem>
                              )}
                            <div className="border-t border-gray-100 my-1"></div>
                            {user.is_active ? (
                              !isLastActiveAdmin(user) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setConfirmAction({
                                      type: "deactivate",
                                      user,
                                    })
                                  }
                                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                >
                                  <PowerOff className="w-4 h-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              )
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({ type: "activate", user })
                                }
                                className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                              >
                                <Power className="w-4 h-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {onRemove && !isLastActiveAdmin(user) && (
                              <>
                                <div className="border-t border-gray-100 my-1"></div>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setConfirmAction({ type: "remove", user })
                                  }
                                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove Super Admin
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div>
            Showing{" "}
            <span className="font-medium text-gray-900">
              {sortedData.length}
            </span>{" "}
            of <span className="font-medium text-gray-900">{data.length}</span>{" "}
            super admins
          </div>
          {statusFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs h-auto p-1"
            >
              Clear filter
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent className="bg-white max-w-md">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                  confirmAction?.type === "activate"
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                {confirmAction?.type === "activate" ? (
                  <Power className="w-5 h-5 text-green-600" />
                ) : confirmAction?.type === "remove" ? (
                  <Trash2 className="w-5 h-5 text-red-600" />
                ) : (
                  <PowerOff className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-semibold">
                  {confirmAction?.type === "activate"
                    ? "Activate Super Admin"
                    : confirmAction?.type === "remove"
                    ? "Remove Super Admin Role"
                    : "Deactivate Super Admin"}
                </AlertDialogTitle>
              </div>
            </div>
            <div className="space-y-3">
              <AlertDialogDescription className="text-sm text-gray-600">
                {confirmAction?.type === "remove" ? (
                  <>
                    Are you sure you want to remove super admin role from{" "}
                    <span className="font-medium text-gray-900">
                      &ldquo;{confirmAction?.user.full_name}&rdquo;
                    </span>
                    ?
                  </>
                ) : (
                  <>
                    Are you sure you want to {confirmAction?.type}{" "}
                    <span className="font-medium text-gray-900">
                      &ldquo;{confirmAction?.user.full_name}&rdquo;
                    </span>
                    ?
                  </>
                )}
              </AlertDialogDescription>

              {confirmAction?.type === "remove" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-800">
                    This will permanently remove their super admin privileges. They will be downgraded to a visitor role and can be re-invited later if needed.
                  </p>
                </div>
              )}

              {confirmAction?.type === "deactivate" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    This will prevent them from accessing the admin portal and
                    all system functions.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={`text-sm ${
                confirmAction?.type === "activate"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {confirmAction?.type === "activate"
                ? "Activate Admin"
                : confirmAction?.type === "remove"
                ? "Remove Super Admin"
                : "Deactivate Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
