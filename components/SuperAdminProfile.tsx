"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Building2,
  Phone,
  Briefcase,
  Save,
  Loader2,
} from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { AuthUtils } from "@/lib/auth";
import type { AuthUser, EditableUserData } from "@/types/auth";
import {
  getUserDisplayName,
  getUserEmail,
  getUserRole,
  isUserActive,
  getUserInitials,
} from "@/utils/userUtils";

interface SuperAdminProfileProps {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

export function SuperAdminProfile({
  open,
  onClose,
  user,
}: SuperAdminProfileProps) {
  const { user: fullUserData, loading, refetchUser } = useUserData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<EditableUserData>({
    full_name: "",
    phone_number: "",
    department: "",
    job_title: "",
  });

  const displayUser = fullUserData || user;
  const displayName = getUserDisplayName(user, fullUserData);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = () => {
    setEditData({
      full_name: fullUserData?.full_name || "",
      phone_number: fullUserData?.phone_number || "",
      department: fullUserData?.department || "",
      job_title: fullUserData?.job_title || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you would call your API to update user data
      // await apiClient.updateUser(displayUser.id, editData);
      console.log("Saving user data:", editData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await refetchUser();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      full_name: "",
      phone_number: "",
      department: "",
      job_title: "",
    });
  };

  const handleInputChange = (field: keyof EditableUserData, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading && !displayUser) {
    return (
      <Dialog open={open} onOpenChange={onClose} modal>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-2xl z-50">
          <div className="flex items-center justify-center py-8 bg-white">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose} modal>
      <DialogContent
        className="sm:max-w-[500px] bg-white border border-gray-200 shadow-2xl z-50"
        style={{
          backgroundColor: "#ffffff",
          backdropFilter: "none",
        }}
      >
        <DialogHeader className="bg-white">
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <User className="w-5 h-5" />
            <span>Profile Settings</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            View and manage your super administrator profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 bg-white">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg">
                {getUserInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {displayName || "Super Administrator"}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <Shield className="w-3 h-3 mr-1" />
                  {AuthUtils.getRoleDisplayName(
                    getUserRole(user, fullUserData)
                  )}
                </Badge>
                {isUserActive(user, fullUserData) && (
                  <Badge
                    variant="outline"
                    className="border-green-300 text-green-700 bg-green-50"
                  >
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">
              Personal Information
            </h4>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name" className="text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={editData.full_name}
                    onChange={(e) =>
                      handleInputChange("full_name", e.target.value)
                    }
                    placeholder="Enter your full name"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="phone_number" className="text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    value={editData.phone_number}
                    onChange={(e) =>
                      handleInputChange("phone_number", e.target.value)
                    }
                    placeholder="Enter your phone number"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="department" className="text-gray-700">
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={editData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                    placeholder="Enter your department"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="job_title" className="text-gray-700">
                    Job Title
                  </Label>
                  <Input
                    id="job_title"
                    value={editData.job_title}
                    onChange={(e) =>
                      handleInputChange("job_title", e.target.value)
                    }
                    placeholder="Enter your job title"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">
                    {getUserEmail(user, fullUserData)}
                  </span>
                </div>

                {fullUserData?.phone_number && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">
                      {fullUserData.phone_number}
                    </span>
                  </div>
                )}

                {fullUserData?.department && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium text-gray-900">
                      {fullUserData.department}
                    </span>
                  </div>
                )}

                {fullUserData?.job_title && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Job Title:</span>
                    <span className="font-medium text-gray-900">
                      {fullUserData.job_title}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Last Login:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(fullUserData?.last_login)}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Account Created:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(fullUserData?.created_at)}
                  </span>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
