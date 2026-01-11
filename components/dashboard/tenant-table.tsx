"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { MoreHorizontal, Edit, Power, PowerOff, Search, Download, Eye, Loader2, X, CheckCircle, XCircle, ArrowUpDown } from "lucide-react";
import { Tenant } from "@/lib/api";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useTheme } from "next-themes";

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const showActions = superAdminCount >= 1;
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'activate' | 'deactivate';
    tenant: Tenant;
  } | null>(null);

  const columnHelper = createColumnHelper<Tenant>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const columns = useMemo<ColumnDef<Tenant>[]>(() => [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:bg-transparent"
        >
          Organization
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const tenant = row.original;
        return (
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
              <div className="text-sm font-medium truncate">
                {tenant.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {tenant.slug}
              </div>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('contact_email', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:bg-transparent"
        >
          Contact
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div>
            <div className="text-sm">{tenant.contact_email}</div>
            <div className="text-xs text-muted-foreground">Primary contact</div>
            {tenant.admin_email && (
              <div className="text-xs text-blue-600 mt-1">
                Admin: {tenant.admin_email}
              </div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('domain', {
      header: 'Domain',
      cell: ({ getValue }) => {
        const domain = getValue();
        return domain ? (
          <div className="text-sm">{domain}</div>
        ) : (
          <span className="text-sm text-muted-foreground">No domain</span>
        );
      },
    }),
    columnHelper.display({
      id: 'timezone',
      header: 'Timezone',
      cell: ({ row }) => {
        const timezone = (row.original as any).timezone;
        return timezone ? (
          <div className="text-sm">{timezone}</div>
        ) : (
          <span className="text-sm text-muted-foreground">Not set</span>
        );
      },
    }),
    columnHelper.accessor('is_active', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:bg-transparent"
        >
          Status
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const isActive = getValue();
        return (
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={`text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('created_at', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:bg-transparent"
        >
          Created
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return (
          <div>
            <div className="text-sm">{format(date, "MMM dd, yyyy")}</div>
            <div className="text-xs text-muted-foreground">{format(date, "HH:mm")}</div>
          </div>
        );
      },
    }),
    columnHelper.accessor('updated_at', {
      header: 'Last Modified',
      cell: ({ getValue, row }) => {
        const updatedAt = getValue();
        const tenant = row.original;
        return updatedAt ? (
          <div>
            <div className="text-sm">{format(new Date(updatedAt), "MMM dd, yyyy")}</div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(updatedAt), "HH:mm")}
              {tenant.last_modified_by && (
                <span> by {tenant.last_modified_by}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Never modified</div>
        );
      },
    }),
    ...(showActions ? [columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                {onViewTenant && currentUserEmail && tenant.admin_email === currentUserEmail && (
                  <DropdownMenuItem
                    onClick={() => onViewTenant(tenant)}
                    className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    disabled={navigationLoading}
                  >
                    {navigationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {navigationLoading ? "Loading..." : "View Tenant Dashboard"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onEdit(tenant)} 
                  className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </DropdownMenuItem>
                {tenant.is_active ? (
                  <DropdownMenuItem
                    onClick={() => setConfirmAction({ type: 'deactivate', tenant })}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                  >
                    <PowerOff className="w-4 h-4" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setConfirmAction({ type: 'activate', tenant })}
                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                  >
                    <Power className="w-4 h-4" />
                    Activate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    })] : []),
  ], [showActions, onEdit, onActivate, onDeactivate, onViewTenant, currentUserEmail, navigationLoading]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const tenant = row.original;
      const searchValue = filterValue.toLowerCase();
      return (
        tenant.name.toLowerCase().includes(searchValue) ||
        tenant.contact_email.toLowerCase().includes(searchValue) ||
        (tenant.admin_email && tenant.admin_email.toLowerCase().includes(searchValue)) ||
        tenant.slug.toLowerCase().includes(searchValue)
      );
    },
    state: {
      sorting,
      globalFilter,
    },
  });

  const exportToCSV = () => {
    const headers = ["Name", "Slug", "Contact Email", "Admin Email", "Domain", "Timezone", "Status", "Created"];
    const csvData = [
      headers.join(","),
      ...table.getFilteredRowModel().rows.map(row => {
        const tenant = row.original;
        return [
          `"${tenant.name}"`,
          `"${tenant.slug}"`,
          `"${tenant.contact_email}"`,
          `"${tenant.admin_email || ''}"`,
          `"${tenant.domain || ''}"`,
          `"${(tenant as any).timezone || ''}"`,
          tenant.is_active ? "Active" : "Inactive",
          format(new Date(tenant.created_at), "MMM dd, yyyy")
        ].join(",");
      })
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

  if (!mounted) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, contact email, admin email or slug..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="rounded-md border" style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderColor: isDark ? '#333333' : '#e5e7eb'
        }}>
          <Table style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}>
            <TableHeader style={{ backgroundColor: isDark ? '#1a1a1a' : '#f9fafb' }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} style={{ borderColor: isDark ? '#333333' : '#e5e7eb' }}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ color: isDark ? '#ffffff' : '#374151' }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    style={{ 
                      borderColor: isDark ? '#333333' : '#e5e7eb',
                      backgroundColor: isDark ? '#000000' : '#ffffff'
                    }}
                    className="hover:bg-opacity-50"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? '#1a1a1a' : '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#ffffff';
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow style={{ borderColor: isDark ? '#333333' : '#e5e7eb' }}>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    style={{ color: isDark ? '#ffffff' : '#000000' }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                        backgroundColor: isDark ? '#1a1a1a' : '#f3f4f6'
                      }}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                          color: isDark ? '#9ca3af' : '#6b7280'
                        }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="text-sm font-medium" style={{ color: isDark ? '#ffffff' : '#111827' }}>No tenants found</div>
                      <div className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                        {globalFilter
                          ? "Try adjusting your search criteria"
                          : "Get started by creating your first tenant"}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            of <span className="font-medium text-foreground">{data.length}</span>{" "}
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