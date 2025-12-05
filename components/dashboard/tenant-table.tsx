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
import { MoreHorizontal, Edit, Power, PowerOff, Search, Download, Eye, Loader2, X, CheckCircle, XCircle } from "lucide-react";
import { Tenant } from "@/lib/api";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface TenantTableProps {
  data: Tenant[];
  loading?: boolean;
  onEdit: (tenant: Tenant) => void;
  onActivate: (tenant: Tenant) => void;
  onDeactivate: (tenant: Tenant) => void;
  onViewTenant?: (tenant: Tenant) => void;
  currentUserEmail?: string;
  currentUserRoles?: string[];
  superAdminCount?: number;
  navigationLoading?: boolean;
}

export function TenantTable({ data, loading = false, onEdit, onActivate, onDeactivate, onViewTenant, currentUserEmail, superAdminCount = 0, navigationLoading = false }: TenantTableProps) {

  const showActions = superAdminCount >= 1;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Tenant>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [confirmAction, setConfirmAction] = useState<{
    type: 'activate' | 'deactivate';
    tenant: Tenant;
  } | null>(null);

  // Filter data based on search term
  const filteredData = data.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.admin_email && tenant.admin_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === "asc" ? -1 : 1;
    if (bValue == null) return sortDirection === "asc" ? 1 : -1;
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Tenant) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Slug", "Contact Email", "Admin Email", "Domain", "Status", "Created"];
    const csvData = [
      headers.join(","),
      ...sortedData.map(tenant => [
        `"${tenant.name}"`,
        `"${tenant.slug}"`,
        `"${tenant.contact_email}"`,
        `"${tenant.admin_email || ''}"`,
        `"${tenant.domain || ''}"`,
        tenant.is_active ? "Active" : "Inactive",
        format(new Date(tenant.created_at), "MMM dd, yyyy")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tenants.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'activate') {
      onActivate(confirmAction.tenant);
    } else {
      onDeactivate(confirmAction.tenant);
    }
    setConfirmAction(null);
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="w-full space-y-4">
      {/* Search and Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, contact email, admin email or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm border-gray-200"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
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
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Organization
                    {sortField === "name" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("contact_email")}
                >
                  <div className="flex items-center">
                    Contact
                    {sortField === "contact_email" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Domain</th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("is_active")}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === "is_active" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center">
                    Created
                    {sortField === "created_at" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Modified</th>
                {showActions && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 7 : 6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        No tenants found
                      </div>
                      <div className="text-xs text-gray-500">
                        {searchTerm
                          ? "Try adjusting your search criteria"
                          : "Get started by creating your first tenant"}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-700">
                            {tenant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {tenant.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {tenant.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {tenant.contact_email}
                      </div>
                      <div className="text-xs text-gray-500">
                        Primary contact
                      </div>
                      {tenant.admin_email && (
                        <div className="text-xs text-blue-600 mt-1">
                          Admin: {tenant.admin_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {tenant.domain ? (
                        <div className="text-sm text-gray-900">
                          {tenant.domain}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No domain</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={tenant.is_active ? "default" : "secondary"}
                        className={`text-xs font-medium ${
                          tenant.is_active
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {tenant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {format(new Date(tenant.created_at), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(tenant.created_at), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {tenant.updated_at ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {format(new Date(tenant.updated_at), "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(tenant.updated_at), "HH:mm")}
                            {tenant.last_modified_by && (
                              <span> by {tenant.last_modified_by}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          Never modified
                        </div>
                      )}
                    </td>
                    {showActions && (
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
                            {onViewTenant && currentUserEmail && tenant.admin_email === currentUserEmail && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => onViewTenant(tenant)}
                                  className="gap-2 hover:bg-gray-50 cursor-pointer"
                                  disabled={navigationLoading}
                                >
                                  {navigationLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                  {navigationLoading ? "Loading..." : "View Tenant Dashboard"}
                                </DropdownMenuItem>
                                <div className="border-t border-gray-100 my-1"></div>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => onEdit(tenant)}
                              className="gap-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <div className="border-t border-gray-100 my-1"></div>
                            {tenant.is_active ? (
                              <DropdownMenuItem
                                onClick={() => setConfirmAction({ type: 'deactivate', tenant })}
                                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <PowerOff className="w-4 h-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setConfirmAction({ type: 'activate', tenant })}
                                className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                              >
                                <Power className="w-4 h-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
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
            tenants
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="bg-white sm:max-w-[500px]">
          {/* Close Button */}
          <button
            onClick={() => setConfirmAction(null)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900 text-xl">
              {confirmAction?.type === 'activate' ? (
                <>
                  <Power className="w-5 h-5 text-green-600" />
                  Activate MSF Tenant
                </>
              ) : (
                <>
                  <PowerOff className="w-5 h-5 text-red-600" />
                  Deactivate MSF Tenant
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 pt-2">
              {confirmAction?.type === 'activate' ? (
                <>
                  Are you sure you want to activate <strong className="text-gray-900">&quot;{confirmAction?.tenant.name}&quot;</strong>?
                  <br />
                  <span className="text-green-700 font-medium mt-2 inline-block">
                    This will allow users to access this tenant and its resources.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to deactivate <strong className="text-gray-900">&quot;{confirmAction?.tenant.name}&quot;</strong>?
                  <br />
                  <span className="text-red-700 font-medium mt-2 inline-block">
                    ⚠️ This will prevent all users from accessing this tenant.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={`flex items-center gap-2 ${
                confirmAction?.type === 'activate'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {confirmAction?.type === 'activate' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Activate Tenant
                </>
              ) : (
                <>
                  <PowerOff className="w-4 h-4" />
                  Deactivate Tenant
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}