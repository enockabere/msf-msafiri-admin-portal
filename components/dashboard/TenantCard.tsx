"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Building2,
  Mail,
  Globe,
  Calendar,
  MoreVertical,
  Edit,
  Power,
  PowerOff,
  Settings,
  Users,
  Loader2,
} from "lucide-react";
import { Tenant } from "@/lib/api";
import apiClient from "@/lib/api";

interface TenantCardProps {
  tenant: Tenant;
  onEdit: () => void;
  onToggleStatus: () => void;
  onManage: () => void;
}

export function TenantCard({ tenant, onEdit, onToggleStatus, onManage }: TenantCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      if (tenant.is_active) {
        await apiClient.deactivateTenant(tenant.id);
      } else {
        await apiClient.activateTenant(tenant.id);
      }
      onToggleStatus();
    } catch (error) {
      console.error('Failed to toggle tenant status:', error);
    } finally {
      setIsToggling(false);
      setShowStatusDialog(false);
    }
  };

  return (
    <>
      <div className={`bg-white rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
        tenant.is_active ? 'border-green-200 hover:border-green-300' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${
                tenant.is_active ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Building2 className={`w-6 h-6 ${
                  tenant.is_active ? 'text-green-600' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {tenant.name}
                </h3>
                <Badge 
                  variant={tenant.is_active ? "default" : "secondary"}
                  className={tenant.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                >
                  {tenant.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onManage}>
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Tenant
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="w-4 h-4 mr-2" />
                  View Users
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowStatusDialog(true)}
                  className={tenant.is_active ? "text-red-600" : "text-green-600"}
                >
                  {tenant.is_active ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{tenant.contact_email}</span>
            </div>
            
            {tenant.domain && (
              <div className="flex items-center text-sm text-gray-600">
                <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{tenant.domain}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Created {formatDate(tenant.created_at)}</span>
            </div>

            {tenant.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {tenant.description}
              </p>
            )}
          </div>

          {/* Slug Display */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Slug</span>
              <code className="text-xs bg-white px-2 py-1 rounded border">
                {tenant.slug}
              </code>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              onClick={onManage}
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Status Toggle Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tenant.is_active ? 'Deactivate' : 'Activate'} Tenant
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {tenant.is_active ? 'deactivate' : 'activate'} 
              <strong> {tenant.name}</strong>? 
              {tenant.is_active && ' This will prevent users from accessing this tenant organization.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={tenant.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : tenant.is_active ? (
                <PowerOff className="w-4 h-4 mr-2" />
              ) : (
                <Power className="w-4 h-4 mr-2" />
              )}
              {isToggling ? 'Processing...' : (tenant.is_active ? 'Deactivate' : 'Activate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}