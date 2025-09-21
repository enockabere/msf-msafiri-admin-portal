"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  AlertCircle,
  CheckCircle,
  Globe,
  MapPin,
  Clock,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import type { AuthUser, UserProfileUpdate } from "@/types/auth";
import apiClient from "@/lib/api";
import {
  getUserDisplayName,
  getUserEmail,
  getUserRole,
  isUserActive,
  getUserInitials,
  formatRoleDisplay,
  formatAuthProviderDisplay,
  formatUserDate,
  getRelativeTime,
  calculateProfileCompleteness,
  getProfileCompletionBadge,
  createInitialFormData,
  getChangedFields,
  isValidEmail,
  isValidPhoneNumber,
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
  const {
    profile,
    profileStats,
    loading,
    error,
    updateProfile,
    refreshProfile,
    clearError,
    hasProfileData,
  } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<UserProfileUpdate>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState<string | null>(null);

  // Use profile data when available, fallback to user prop
  const displayUser = profile || user;
  const displayName = getUserDisplayName(user, profile);
  const profileCompletion = calculateProfileCompleteness(profile);
  const completionBadge = getProfileCompletionBadge(profile);

  // Validation functions
  const validateField = (
    field: keyof UserProfileUpdate,
    value: string
  ): string | null => {
    switch (field) {
      case "email":
        if (value && !isValidEmail(value)) {
          return "Please enter a valid email address";
        }
        break;
      case "phone_number":
        if (value && !isValidPhoneNumber(value)) {
          return "Please enter a valid phone number";
        }
        break;
      case "full_name":
        if (value && value.trim().length < 2) {
          return "Name must be at least 2 characters long";
        }
        break;
    }
    return null;
  };

  // Check if email is being changed
  const isEmailBeingChanged = (newEmail: string): boolean => {
    const currentEmail = getUserEmail(user, profile);
    return newEmail !== currentEmail && newEmail.trim() !== "";
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};

    Object.entries(editData).forEach(([field, value]) => {
      if (value && typeof value === "string") {
        const error = validateField(field as keyof UserProfileUpdate, value);
        if (error) {
          errors[field] = error;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = () => {
    if (profile) {
      const initialData = createInitialFormData(profile);
      setEditData(initialData);
    }
    setIsEditing(true);
    setSuccessMessage(null);
    setValidationErrors({});
    clearError();
  };

  const handleSave = async () => {
    // Validate all fields first
    if (!validateAllFields()) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    clearError();

    try {
      // Only send changed fields to the API
      const changedFields = getChangedFields(profile, editData);

      if (Object.keys(changedFields).length === 0) {
        setSuccessMessage("No changes to save.");
        setIsEditing(false);
        return;
      }

      console.log("Saving profile changes:", changedFields);

      // Check if email is being changed
      const newEmail = editData.email;
      if (newEmail && isEmailBeingChanged(newEmail)) {
        // Handle email change separately
        try {
          await apiClient.requestEmailChange(newEmail);
          setEmailChangeRequested(true);
          setPendingEmailChange(newEmail);
          setSuccessMessage(
            `Email change verification sent to ${newEmail}. Please check your email and click the verification link. You will be logged out after verification.`
          );
          setIsEditing(false);
          setEditData({});
          
          // Show toast notification
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('showToast', {
              detail: {
                message: `Verification email sent to ${newEmail}`,
                type: 'info'
              }
            });
            window.dispatchEvent(event);
          }
          return;
        } catch (emailError) {
          console.error("Failed to request email change:", emailError);
          setError("Failed to send email verification. Please try again.");
          return;
        }
      }

      // Update other fields normally (excluding email)
      const fieldsToUpdate = { ...changedFields };
      delete fieldsToUpdate.email; // Remove email from regular update

      if (Object.keys(fieldsToUpdate).length > 0) {
        const success = await updateProfile(fieldsToUpdate);

        if (success) {
          setSuccessMessage("Profile updated successfully!");
          setIsEditing(false);
          setEditData({});

          // Show toast notification
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('showToast', {
              detail: {
                message: 'Your information has been updated successfully!',
                type: 'success'
              }
            });
            window.dispatchEvent(event);
          }

          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        setSuccessMessage("No changes to save.");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setSuccessMessage(null);
    setValidationErrors({});
    clearError();
  };

  const handleInputChange = (field: keyof UserProfileUpdate, value: string) => {
    // Update the field value
    setEditData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validate the field in real-time
    const error = validateField(field, value);
    if (error) {
      setValidationErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSuccessMessage(null);
      setIsEditing(false);
      setEditData({});
      setValidationErrors({});
      setEmailChangeRequested(false);
      setPendingEmailChange(null);
      clearError();
    }
  }, [open, clearError]);

  // Refresh profile data when dialog opens
  useEffect(() => {
    if (open && hasProfileData) {
      refreshProfile();
    }
  }, [open, hasProfileData, refreshProfile]);

  if (loading && !displayUser) {
    return (
      <Dialog open={open} onOpenChange={onClose} modal>
        <DialogContent className="sm:max-w-[600px] bg-white border border-gray-200 shadow-2xl z-50">
          <div className="flex items-center justify-center py-8 bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose} modal>
      <DialogContent
        className="sm:max-w-[600px] bg-white border border-gray-200 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
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
            View and manage your profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 bg-white">
          {/* Success Message */}
          {successMessage && (
            <Alert className={emailChangeRequested ? "border-blue-300 bg-blue-50" : "border-green-300 bg-green-50"}>
              <CheckCircle className={`h-4 w-4 ${emailChangeRequested ? "text-blue-600" : "text-green-600"}`} />
              <AlertDescription className={emailChangeRequested ? "text-blue-700" : "text-green-700"}>
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Change Pending Notice */}
          {emailChangeRequested && pendingEmailChange && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <Mail className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                <strong>Email Change Pending:</strong> A verification email has been sent to {pendingEmailChange}. 
                Please check your email and click the verification link to complete the change. 
                You will be automatically logged out after verification to refresh your session.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-lg">
                {getUserInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {displayName || "Administrator"}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <Shield className="w-3 h-3 mr-1" />
                  {formatRoleDisplay(getUserRole(user, profile))}
                </Badge>
                {isUserActive(user, profile) && (
                  <Badge
                    variant="outline"
                    className="border-green-300 text-green-700 bg-green-50"
                  >
                    Active
                  </Badge>
                )}
                {profile && (
                  <Badge
                    variant="outline"
                    className={`border-${completionBadge.color}-300 text-${completionBadge.color}-700 bg-${completionBadge.color}-50`}
                  >
                    {completionBadge.text}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          {profile && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Profile Completion
                </span>
                <span className="text-sm text-gray-600">
                  {profileCompletion.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${profileCompletion.percentage}%`,
                  }}
                ></div>
              </div>
              {profileCompletion.missing_fields.length > 0 && (
                <p className="text-xs text-gray-500">
                  Missing: {profileCompletion.missing_fields.join(", ")}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Profile Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">
              Personal Information
            </h4>

            {isEditing ? (
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-gray-700 mb-2 block">
                        Full Name *
                      </Label>
                      <Input
                        id="full_name"
                        value={editData.full_name || ""}
                        onChange={(e) =>
                          handleInputChange("full_name", e.target.value)
                        }
                        placeholder="Enter your full name"
                        className="bg-white border-gray-300 mt-2"
                      />
                      {validationErrors.full_name && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.full_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number" className="text-gray-700 mb-2 block">
                        Phone Number
                      </Label>
                      <Input
                        id="phone_number"
                        value={editData.phone_number || ""}
                        onChange={(e) =>
                          handleInputChange("phone_number", e.target.value)
                        }
                        placeholder="+254712345678 (include country code)"
                        className="bg-white border-gray-300 mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Please include country code (e.g., +254 for Kenya, +31 for Netherlands)
                      </p>
                      {validationErrors.phone_number && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.phone_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 mb-2 block">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email || ""}
                      disabled
                      className="bg-gray-100 border-gray-300 mt-2 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed. Contact system administrator if needed.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={
                      isSaving || Object.keys(validationErrors).length > 0
                    }
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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
                {/* Basic Information Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">
                      {getUserEmail(user, profile)}
                    </span>
                  </div>

                  {profile?.phone_number && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">
                        {profile.phone_number}
                      </span>
                    </div>
                  )}


                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Last Login:</span>
                    <span className="font-medium text-gray-900">
                      {getRelativeTime(profile?.last_login)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Account Created:</span>
                    <span className="font-medium text-gray-900">
                      {formatUserDate(profile?.created_at, "Unknown")}
                    </span>
                  </div>

                  {profile?.profile_updated_at && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Profile Updated:</span>
                      <span className="font-medium text-gray-900">
                        {getRelativeTime(profile.profile_updated_at)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="w-full bg-white border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Security Information */}
          {profileStats && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Security Information
                </h4>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Authentication</div>
                    <div className="font-medium text-gray-900">
                      {formatAuthProviderDisplay(
                        profileStats.security_status.auth_method
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Account Age</div>
                    <div className="font-medium text-gray-900">
                      {profileStats.account_age_days} days
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Strong Password</div>
                    <div className="font-medium text-gray-900">
                      {profile?.has_strong_password ? "Yes" : "No"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Email Verified</div>
                    <div className="font-medium text-gray-900">
                      {profileStats.security_status.email_verified
                        ? "Yes"
                        : "No"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
