"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import apiClient, { LoginResponse, UserRole } from "@/lib/api";

// Microsoft icon as SVG component
const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
  </svg>
);

interface LoginFormData {
  email: string;
  password: string;
  tenantSlug: string;
}

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"sso" | "credentials">("sso");
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    tenantSlug: "msf-kenya", // Default tenant
  });

  const router = useRouter();

  // Handle Microsoft SSO Login
  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Simulate Microsoft OAuth flow
      // In production, you would use Microsoft Graph or MSAL
      const mockMicrosoftToken = "mock-microsoft-access-token";

      // Call your API's SSO endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/sso/microsoft`,
        {
          method: "POST",
          headers: {
            "X-Microsoft-Token": mockMicrosoftToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "SSO authentication failed");
      }

      const loginResponse: LoginResponse = await response.json();

      // Store token and create session
      await createUserSession(loginResponse);

      // Handle first login
      if (loginResponse.first_login) {
        // Show welcome message or redirect to onboarding
        console.log("First login:", loginResponse.welcome_message);
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("SSO Login error:", error);
      setError(
        error instanceof Error ? error.message : "Microsoft SSO login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Traditional Login (Admin/Super Admin)
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      // Validate admin credentials
      if (!formData.email || !formData.password) {
        throw new Error("Please enter both email and password");
      }

      // Use tenant login for non-super admins, regular login for super admins
      const loginResponse = await apiClient.login(
        formData.email,
        formData.password,
        formData.tenantSlug || undefined
      );

      // Create session
      await createUserSession(loginResponse);

      // Handle first login
      if (loginResponse.first_login) {
        console.log("First login:", loginResponse.welcome_message);
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Credential login error:", error);
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Create user session and store in localStorage/cookies
  const createUserSession = async (loginResponse: LoginResponse) => {
    // Store access token
    apiClient.setToken(loginResponse.access_token);

    try {
      // Get user details
      const user = await apiClient.getCurrentUser();

      // Store session data
      const sessionData = {
        user,
        token: loginResponse.access_token,
        loginTime: new Date().toISOString(),
        firstLogin: loginResponse.first_login || false,
        welcomeMessage: loginResponse.welcome_message,
      };

      // Store in localStorage (consider using secure cookies in production)
      localStorage.setItem("msafiri_session", JSON.stringify(sessionData));
      localStorage.setItem("msafiri_user", JSON.stringify(user));

      console.log("Session created for:", user.full_name, "Role:", user.role);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleInputChange =
    (field: keyof LoginFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
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
                <p className="text-sm text-muted-foreground">Admin Portal</p>
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
                  <span>Admin Access Only</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Welcome to <span className="text-red-600">MSF Msafiri</span>{" "}
                  Admin Portal
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Secure administrative access for MSF personnel. Manage visitor
                  operations, events, and system administration with role-based
                  permissions.
                </p>
              </div>

              {/* Feature Highlights - Same as before */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      User Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage staff and visitors
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Analytics Dashboard
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Real-time insights
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      System Administration
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure and manage
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Secure Access
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Role-based permissions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Enhanced Login Card */}
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
                        Admin Sign In
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

                    {/* Login Methods Tabs */}
                    <Tabs
                      value={loginMethod}
                      onValueChange={(value: string) =>
                        setLoginMethod(value as "sso" | "credentials")
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sso">Microsoft SSO</TabsTrigger>
                        <TabsTrigger value="credentials">
                          Admin Login
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

                      {/* Admin Credentials Tab */}
                      <TabsContent value="credentials" className="space-y-4">
                        <form
                          onSubmit={handleCredentialLogin}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange("email")}
                              placeholder="admin@msafiri.org"
                              required
                              disabled={isLoading}
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

                          <div className="space-y-2">
                            <Label htmlFor="tenant">Organization</Label>
                            <select
                              id="tenant"
                              value={formData.tenantSlug}
                              onChange={handleInputChange("tenantSlug")}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              disabled={isLoading}
                            >
                              <option value="">
                                Super Admin (All Organizations)
                              </option>
                              <option value="msf-kenya">MSF Kenya</option>
                              <option value="msf-uganda">MSF Uganda</option>
                              <option value="msf-somalia">MSF Somalia</option>
                            </select>
                          </div>

                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-base shadow-lg transition-all duration-200"
                          >
                            {isLoading && loginMethod === "credentials" ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              <>
                                <Shield className="w-5 h-5 mr-3" />
                                Sign In as Admin
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
                            Secure Admin Access
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            This portal is restricted to authorized MSF
                            administrators only. All login attempts are logged
                            and monitored.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Roles */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        Admin Access Levels
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            Super Admin
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            MT Admin
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            HR Admin
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            Event Admin
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
                Admin Portal
              </Badge>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
