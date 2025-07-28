"use client";

import { useState } from "react";
import Image from "next/image";
// import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, BarChart3, Settings, Loader2 } from "lucide-react";

// Microsoft icon as SVG component since it might not be available in lucide-react
const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
  </svg>
);

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      // For now, just simulate login - replace with actual NextAuth call later
      // const result = await signIn("microsoft", {
      //   callbackUrl: "/dashboard",
      //   redirect: false,
      // })

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, redirect to dashboard
      console.log("Login attempted - will implement NextAuth later");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* MSF Logo from public folder */}
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

            {/* Version Badge */}
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
                  <span>Secure Admin Access</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Welcome to <span className="text-red-600">MSF Msafiri</span>{" "}
                  Admin Portal
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Manage MSF Kenya operations with our comprehensive admin
                  dashboard. Handle visitor management, event coordination, and
                  operational oversight from one secure platform.
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
                      Visitor Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Track and manage all visitors
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
                      Real-time insights and reports
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Event Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Coordinate events and logistics
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

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Enterprise Security</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">System Online</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span className="text-sm">ISO 27001 Compliant</span>
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
                      <div className="w-50 h-26  flex items-center justify-center mx-auto">
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
                        Use your Microsoft work account to access the admin
                        portal
                      </p>
                    </div>

                    {/* Login Button */}
                    <Button
                      onClick={handleMicrosoftLogin}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-msf hover:opacity-90 text-white font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl"
                    >
                      {isLoading ? (
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

                    {/* Security Note */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            Secure Authentication
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Your login is secured with Microsoft&#39;s
                            enterprise-grade authentication. Only authorized MSF
                            personnel can access this portal.
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
                className="bg-green-50 text-green-700 border-green-200"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                All Systems Operational
              </Badge>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
