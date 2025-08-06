"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  BarChart3,
  Settings,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Microsoft icon as SVG component
const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
  </svg>
);

interface LoginFormData {
  email: string;
  password: string;
}

// Extended session interface to handle our custom properties
interface ExtendedSession {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    tenantId?: string;
    isActive?: boolean;
    accessToken?: string;
    firstLogin?: boolean;
  };
}

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"sso" | "credentials">("sso");
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  // Clear messages when switching tabs
  const handleTabChange = (value: string) => {
    setLoginMethod(value as "sso" | "credentials");
    setError("");
    setSuccess("");
  };

  // Handle Microsoft SSO Login
  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const result = await signIn("azure-ad", {
        redirect: false,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        // More specific error handling
        if (
          result.error === "OAuthSignInError" ||
          result.error === "OAuthCallbackError"
        ) {
          throw new Error(
            "Microsoft SSO authentication failed. Please try again or contact your administrator."
          );
        } else if (result.error === "AccessDenied") {
          throw new Error(
            "Access denied. Your Microsoft account may not be authorized for this application."
          );
        } else {
          throw new Error(
            "Microsoft SSO authentication failed. Please try again."
          );
        }
      }

      if (result?.ok) {
        setSuccess("Successfully authenticated with Microsoft!");

        // Check session and handle first login
        const session = (await getSession()) as ExtendedSession | null;
        if (session?.user?.firstLogin) {
          console.log("First login - show welcome message");
        }

        // Small delay to show success message
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
      }
    } catch (error) {
      console.error("SSO Login error:", error);
      setError(
        error instanceof Error ? error.message : "Microsoft SSO login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Super Admin Login (credentials only)
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      // Validate credentials
      if (!formData.email || !formData.password) {
        throw new Error("Please enter both email and password");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      const result = await signIn("admin-credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        // Enhanced error handling based on NextAuth error types
        if (result.error === "CredentialsSignin") {
          throw new Error(
            "Invalid email or password. Please check your credentials and try again."
          );
        } else if (result.error === "AccessDenied") {
          throw new Error(
            "Access denied. Only Super Administrators can access this portal."
          );
        } else if (result.error === "Configuration") {
          throw new Error(
            "Authentication configuration error. Please contact support."
          );
        } else {
          throw new Error(
            "Login failed. Please check your credentials and try again."
          );
        }
      }

      if (result?.ok) {
        setSuccess("Login successful! Redirecting to dashboard...");

        // Check session and handle first login
        const session = (await getSession()) as ExtendedSession | null;
        if (session?.user?.firstLogin) {
          console.log("First login - show welcome message");
        }

        // Small delay to show success message
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
      }
    } catch (error) {
      console.error("Credential login error:", error);
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof LoginFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear errors when user starts typing
      if (error) setError("");
    };

  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-white p-1">
                <Image
                  src="/icon/favicon.png"
                  alt="MSF Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  MSF Msafiri
                </h1>
                <p className="text-sm text-muted-foreground">
                  Super Admin Portal
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-card">
              v1.0
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Welcome Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Super Admin Access Only</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Welcome to <span className="text-red-600">MSF Msafiri</span>{" "}
                  Super Admin Portal
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Secure super administrative access for MSF system
                  administrators. Manage all organizations, users, and
                  system-wide configurations with full administrative
                  privileges.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Global User Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage all users across organizations
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      System Analytics
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Complete system insights
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      System Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure system-wide settings
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Full System Access
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Complete administrative control
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl border-gray-200 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Login Header */}
                    <div className="text-center space-y-2">
                      <div className="w-50 h-26 flex items-center justify-center mx-auto">
                        <Image
                          src="/icon/logo1.png"
                          alt="MSF Logo"
                          width={90}
                          height={70}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Super Admin Sign In
                      </h2>
                      <p className="text-muted-foreground">
                        Choose your authentication method
                      </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Success Alert */}
                    {success && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {success}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Login Methods Tabs */}
                    <Tabs
                      value={loginMethod}
                      onValueChange={handleTabChange}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sso">Microsoft SSO</TabsTrigger>
                        <TabsTrigger value="credentials">
                          Super Admin Login
                        </TabsTrigger>
                      </TabsList>

                      {/* Microsoft SSO Tab */}
                      <TabsContent value="sso" className="space-y-4">
                        <div className="text-center space-y-3">
                          <p className="text-sm text-muted-foreground">
                            For MSF staff with Microsoft work accounts
                          </p>

                          <Button
                            onClick={handleMicrosoftLogin}
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-msf hover:opacity-90 text-white font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl"
                          >
                            {isLoading && loginMethod === "sso" ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              <>
                                <MicrosoftIcon className="w-5 h-5 mr-3" />
                                Sign in with Microsoft
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>

                      {/* Super Admin Credentials Tab */}
                      <TabsContent value="credentials" className="space-y-4">
                        <form
                          onSubmit={handleCredentialLogin}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="email">Super Admin Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange("email")}
                              placeholder="superadmin@msafiri.org"
                              required
                              disabled={isLoading}
                              className={
                                error && !formData.email ? "border-red-300" : ""
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleInputChange("password")}
                                placeholder="Enter your password"
                                required
                                disabled={isLoading}
                                className={
                                  error && !formData.password
                                    ? "border-red-300"
                                    : ""
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-base shadow-lg transition-all duration-200 disabled:opacity-50"
                          >
                            {isLoading && loginMethod === "credentials" ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              <>
                                <Shield className="w-5 h-5 mr-3" />
                                Sign In as Super Admin
                              </>
                            )}
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>

                    {/* Security Note */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            Super Admin Access Only
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            This portal is restricted to Super Administrators
                            only. You have full system access across all
                            organizations. All login attempts are logged and
                            monitored.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Super Admin Privileges */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        Super Admin Privileges
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            Full System Administration
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            All Organization Management
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            Global User & Role Management
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            System Configuration Control
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full p-6 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>© 2025 MSF Msafiri. All rights reserved.</span>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Super Admin Portal
              </Badge>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
