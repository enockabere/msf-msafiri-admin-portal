"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Shield, Eye, EyeOff, Check, X } from "lucide-react";
import apiClient from "@/lib/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const verifyResetToken = useCallback(async () => {
    if (!token) return;

    setVerifying(true);
    try {
      const response = await fetch(`${apiClient.getBaseUrl()}/api/v1/password/verify-reset-token?token=${token}`);
      
      if (!response.ok) {
        let errorMessage = "Invalid or expired reset token";
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          if (response.status === 400) {
            errorMessage = "This reset link has expired or is invalid. Please request a new one.";
          } else if (response.status === 404) {
            errorMessage = "Reset token not found. Please request a new reset link.";
          } else {
            errorMessage = `Server error (${response.status}). Please try again later.`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUserEmail(data.user_email);
      setVerifying(false);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to verify reset token");
      setVerifying(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
      setVerifying(false);
      return;
    }

    verifyResetToken();
  }, [token, verifyResetToken]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    return errors;
  };

  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    return { checks, strength: passedChecks };
  };

  const passwordsMatch = formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword;

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === "newPassword") {
      const passwordErrors = validatePassword(value);
      if (passwordErrors.length > 0) {
        setValidationErrors(prev => ({ ...prev, newPassword: passwordErrors[0] }));
      }
    }

    if (field === "confirmPassword" && formData.newPassword) {
      if (value !== formData.newPassword) {
        setValidationErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    
    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      errors.newPassword = passwordErrors[0];
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.newPassword) {
      errors.newPassword = "Password is required";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiClient.getBaseUrl()}/api/v1/password/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to reset password" }));
        throw new Error(errorData.detail || "Failed to reset password");
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push("/login?message=password-reset&email=" + encodeURIComponent(userEmail));
      }, 3000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
              <h2 className="text-xl font-semibold">Verifying Reset Link</h2>
              <p className="text-gray-600">Please wait while we verify your reset token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <XCircle className="w-6 h-6 mr-2" />
              Reset Link Invalid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => router.push("/login")} className="w-full">
                Back to Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/login?forgot=true")} 
                className="w-full"
              >
                Request New Reset Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="w-6 h-6 mr-2" />
              Password Reset Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your password has been successfully reset for:
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800">{userEmail}</p>
            </div>
            
            <p className="text-sm text-gray-500">
              Redirecting to login page in a few seconds...
            </p>
            
            <Button onClick={() => router.push("/login")} className="w-full">
              Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg/3.png"
          alt="Background"
          fill
          className="object-cover"
          priority={false}
          loading="lazy"
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/90 to-red-50/80"></div>
      </div>
      <Card className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-sm border shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Reset Your Password
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter your new password for: <strong>{userEmail}</strong>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                  className={formData.newPassword ? (passwordStrength.strength === 4 ? "border-green-500" : "border-orange-500") : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {formData.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 1 ? 'w-1/4 bg-red-500' :
                          passwordStrength.strength === 2 ? 'w-2/4 bg-orange-500' :
                          passwordStrength.strength === 3 ? 'w-3/4 bg-yellow-500' :
                          passwordStrength.strength === 4 ? 'w-full bg-green-500' : 'w-0'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength === 1 ? 'text-red-600' :
                      passwordStrength.strength === 2 ? 'text-orange-600' :
                      passwordStrength.strength === 3 ? 'text-yellow-600' :
                      passwordStrength.strength === 4 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {passwordStrength.strength === 1 ? 'Weak' :
                       passwordStrength.strength === 2 ? 'Fair' :
                       passwordStrength.strength === 3 ? 'Good' :
                       passwordStrength.strength === 4 ? 'Strong' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center space-x-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.checks.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.checks.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.checks.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.checks.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>Number</span>
                    </div>
                  </div>
                </div>
              )}
              
              {validationErrors.newPassword && (
                <p className="text-sm text-red-600">{validationErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                  className={formData.confirmPassword ? (passwordsMatch ? "border-green-500" : "border-red-500") : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {formData.confirmPassword && (
                <div className={`flex items-center space-x-1 text-xs ${
                  passwordsMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
              
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || Object.keys(validationErrors).length > 0 || !passwordsMatch || passwordStrength.strength < 4}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/login")}
                className="text-sm"
              >
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
              <h2 className="text-xl font-semibold">Loading...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}