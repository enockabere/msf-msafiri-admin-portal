"use client";

import React, { useState, useEffect, useId } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  LogIn,
  Download,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { SuperAdminFooter } from "@/components/layout/SuperAdminFooter";

// API URL helper
const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:8000";
    }
    return process.env.NEXT_PUBLIC_PROD_API_URL || "https://msafiri-visitor-api.onrender.com";
  }

  return process.env.NEXT_PUBLIC_PROD_API_URL || "https://msafiri-visitor-api.onrender.com";
};

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginComponent() {
  const id = useId();
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'resources' | 'about'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"sso" | "credentials">("sso");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [isApiConnected, setIsApiConnected] = useState<boolean>(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const heroImages = [
    "/portal/hero/1.png",
    "/portal/hero/2.png",
    "/portal/hero/3.svg"
  ];

  const [formData, setFormData] = useState<LoginFormData>({
    email: process.env.NEXT_PUBLIC_DEFAULT_EMAIL || "",
    password: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  console.log('LoginComponent theme:', theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is already authenticated and redirect
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push(redirectTo);
    }
  }, [status, session, router, redirectTo]);

  useEffect(() => {
    const url = getApiUrl();
    setApiUrl(url);
    checkApiConnectivity(url);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Debug theme application
    const observer = new MutationObserver(() => {
      const htmlClass = document.documentElement.className;
      const bodyClass = document.body.className;
      console.log('HTML classes:', htmlClass);
      console.log('Body classes:', bodyClass);
      console.log('Has dark class:', htmlClass.includes('dark'));
      
      // Check if Tailwind dark mode is working
      const testElement = document.querySelector('.dark\\:text-slate-100');
      if (testElement) {
        const computedStyle = window.getComputedStyle(testElement);
        console.log('Test element color:', computedStyle.color);
        console.log('Test element classes:', testElement.className);
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const checkApiConnectivity = async (url: string) => {
    try {
      const healthUrl = `${url.replace("/api/v1", "")}/health`;
      const response = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        setIsApiConnected(true);
      } else {
        setIsApiConnected(false);
      }
    } catch (error) {
      setIsApiConnected(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      setLoginMethod("sso");

      const result = await signIn("azure-ad", {
        redirect: false,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        setSuccess("Redirecting to Microsoft...");
        setIsOpen(false);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Microsoft SSO login failed";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      setLoginMethod("credentials");

      if (!formData.email || !formData.password) {
        throw new Error("Please enter both email and password");
      }

      const callbackUrl =
        formData.password === "password@1234"
          ? "/change-password?required=true&default=true"
          : redirectTo;

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          throw new Error(
            "Invalid email or password. Please check your credentials."
          );
        }
        throw new Error("Login failed. Please try again.");
      }

      if (result?.ok) {
        setSuccess("Login successful! Redirecting...");
        
        // Immediate redirect without closing dialog or timeout
        if (formData.password === "password@1234") {
          router.push("/change-password?required=true&default=true");
        } else {
          router.push(redirectTo);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof LoginFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white border shadow-xl rounded-lg p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 transition-colors duration-200 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Top Navbar - Made sticky */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm flex items-center justify-between px-10 py-4 animate-in slide-in-from-top duration-300 transition-all ${isScrolled ? 'shadow-sm' : ''} ${theme === 'dark' ? 'bg-black/95 border-b border-gray-800' : 'bg-white/95 border-b border-slate-100'}`}>
        <div className={`flex items-center gap-2 font-bold text-xl tracking-tight animate-in fade-in-0 slide-in-from-left duration-500 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          <Image
            src="/portal/icon/favicon.png"
            alt="MSafiri Logo"
            width={32}
            height={32}
            className="rounded-sm"
          />
          MSafiri
        </div>

        <NavigationMenu>
          <NavigationMenuList className="hidden md:flex gap-4 animate-in fade-in-0 slide-in-from-top duration-700">
            {["Home", "Resources", "About"].map((item, index) => (
              <NavigationMenuItem key={item} className={`animate-in fade-in-0 slide-in-from-top duration-${500 + index * 100}`}>
                <NavigationMenuLink 
                  className={`${navigationMenuTriggerStyle()} ${
                    (item === "Home" && currentView === 'home') || 
                    (item === "Resources" && currentView === 'resources') ||
                    (item === "About" && currentView === 'about')
                      ? 'bg-slate-100 text-slate-900' 
                      : ''
                  }`}
                  onClick={() => {
                    if (item === "Resources") setCurrentView('resources');
                    else if (item === "About") setCurrentView('about');
                    else setCurrentView('home');
                  }}
                >
                  {item}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full px-6 border-slate-300 animate-in fade-in-0 slide-in-from-right duration-500 hover:scale-105 transition-transform">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </DialogTrigger>
          <DialogContent className={`sm:max-w-sm border ${theme === 'dark' ? 'bg-black border-gray-700 [&>button]:text-white [&>button]:hover:text-gray-300' : 'bg-white border-slate-200 [&>button]:text-black [&>button]:hover:text-gray-700'}`}>
            <DialogHeader className="items-center">
              <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-black'}>Sign In</DialogTitle>
              <DialogDescription className={theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}>Access your MSafiri admin portal</DialogDescription>
            </DialogHeader>
            
            {/* Alert Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleCredentialLogin}>
              <div className="grid gap-3">
                <Label htmlFor="email" className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="admin@msafiri.com"
                  disabled={isLoading}
                  className={theme === 'dark' ? 'text-white bg-gray-900 border-gray-600' : 'text-black'}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password" className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="Password"
                    disabled={isLoading}
                    className={`pr-10 ${theme === 'dark' ? 'text-white bg-gray-900 border-gray-600' : 'text-black'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </form>
            
            <DialogFooter className="pt-4 sm:flex-col">
              <Button 
                onClick={handleCredentialLogin}
                disabled={isLoading || !isApiConnected}
                className={`font-medium ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                {isLoading && loginMethod === "credentials" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin text-white dark:text-slate-900" />Signing in...</>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-300 after:h-px after:flex-1 after:bg-slate-300">
                <span className="text-slate-600 text-xs font-medium">Or</span>
              </div>
              <Button
                variant="outline"
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
                className={`font-medium ${theme === 'dark' ? 'text-white border-gray-600 hover:bg-gray-800' : 'text-slate-900 border-slate-300 hover:bg-slate-50'}`}
              >
                {isLoading && loginMethod === "sso" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-900 dark:text-slate-100" />Redirecting...</>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#f25022" d="M0 0h11v11H0z" />
                      <path fill="#00a4ef" d="M13 0h11v11H13z" />
                      <path fill="#7fba00" d="M0 13h11v11H0z" />
                      <path fill="#ffb900" d="M13 13h11v11H13z" />
                    </svg>
                    <span className={theme === 'dark' ? 'text-white' : 'text-black'}>Continue with Microsoft</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </header>

      {/* Hero Section */}
      {currentView === 'home' && (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-10 py-2 items-center max-w-7xl mx-auto mt-16">
          {/* Text Content */}
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-left duration-1000">
            <h1 className="text-4xl lg:text-5xl font-serif leading-tight">
              <span className={`inline-block animate-in fade-in-0 slide-in-from-bottom duration-1200 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Trusted</span>{" "}
              <span className="inline-block animate-in fade-in-0 slide-in-from-bottom duration-1400 text-red-600">One-Stop</span>{" "}
              <span className={`inline-block animate-in fade-in-0 slide-in-from-bottom duration-1600 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Companion</span>{" "}
              <span className={`inline-block animate-in fade-in-0 slide-in-from-bottom duration-1800 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>for</span>{" "}
              <span className="inline-block animate-in fade-in-0 slide-in-from-bottom duration-2000 text-red-600 font-bold">MSF</span>{" "}
              <span className={`inline-block animate-in fade-in-0 slide-in-from-bottom duration-2200 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-400'}`}>Traveller</span>
            </h1>
            
            <p className={`text-base max-w-md leading-relaxed animate-in fade-in-0 slide-in-from-bottom duration-1400 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
              Manage tenants, streamline event planning, invite and track visitors, allocate rooms and transport—all in one secure platform.
            </p>

            <div className="flex gap-4 pt-2 animate-in fade-in-0 slide-in-from-bottom duration-1600">
              <Button className="bg-red-600 text-white hover:bg-red-700 rounded-full px-8 py-6 text-md hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Download className="mr-2 h-5 w-5" />
                Download App
              </Button>
              <Button variant="outline" className={`rounded-full px-8 py-6 text-md hover:scale-105 transition-all duration-200 hover:border-red-200 hover:text-red-600 ${theme === 'dark' ? 'border-gray-700 hover:border-red-400 hover:text-red-400' : 'border-slate-200'}`}>
                Learn More
              </Button>
            </div>
          </div>

          {/* Visual Content */}
          <div className="flex items-center justify-center my-16 animate-in fade-in-0 slide-in-from-right duration-1000">
            <Carousel
              plugins={[Autoplay({ delay: 3000 })]}
              className="w-full max-w-lg relative"
            >
              <CarouselContent>
                {heroImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="flex items-center justify-center">
                      <Image
                        src={image}
                        alt="MSF Operations Visualization"
                        width={600}
                        height={600}
                        priority={index === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        </main>
      )}

      {/* Resources Section */}
      {currentView === 'resources' && (
        <main className="max-w-7xl mx-auto px-10 py-20 animate-in fade-in-0 slide-in-from-bottom duration-500 mt-20">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className={`text-3xl lg:text-4xl font-serif ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                Resources & <span className="text-red-600">Documentation</span>
              </h1>
              <p className={`text-base max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                Stay updated with the latest changes, improvements, and documentation for MSafiri.
              </p>
            </div>

            <div className="grid gap-8">
              <Card className="max-w-5xl mx-auto">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle>Changelog</CardTitle>
                      <CardDescription>Version history and updates</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border-l-2 border-red-200 pl-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-600 text-white hover:bg-red-700">
                            v2.1.0
                          </Badge>
                          <Badge variant="secondary">Latest</Badge>
                        </div>
                        <h4 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Enhanced Login & Authentication</h4>
                        <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                          <li>• Added Microsoft SSO integration</li>
                          <li>• Improved login modal design</li>
                          <li>• Enhanced security features</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            v2.0.5
                          </Badge>
                        </div>
                        <h4 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>UI/UX Improvements</h4>
                        <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                          <li>• Updated dashboard layout</li>
                          <li>• Improved mobile responsiveness</li>
                          <li>• Added dark mode support</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            v2.0.0
                          </Badge>
                        </div>
                        <h4 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Major Release</h4>
                        <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                          <li>• Complete system redesign</li>
                          <li>• New event management features</li>
                          <li>• Enhanced performance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      )}

      {/* About Section */}
      {currentView === 'about' && (
        <main className="max-w-7xl mx-auto px-10 py-20 animate-in fade-in-0 slide-in-from-bottom duration-500 mt-20">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className={`text-3xl lg:text-4xl font-serif ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                About <span className="text-red-600">MSafiri</span>
              </h1>
              <p className={`text-base max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                Your trusted companion for MSF operations management
              </p>
            </div>

            <div className="grid gap-8 max-w-4xl mx-auto">
              <div className={`rounded-lg p-8 shadow-sm ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-slate-200'}`}>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Our Mission</h3>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Empowering MSF operations worldwide</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                      MSafiri is designed specifically for Médecins Sans Frontières (MSF) to streamline and enhance operational efficiency across all missions. Our comprehensive platform serves as a one-stop solution for managing the complex logistics of humanitarian operations.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Key Features</h4>
                        <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                          <li>• Event planning and management</li>
                          <li>• Visitor tracking and invitations</li>
                          <li>• Accommodation allocation</li>
                          <li>• Transport coordination</li>
                          <li>• Multi-tenant support</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Built For</h4>
                        <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                          <li>• MSF field coordinators</li>
                          <li>• Operations managers</li>
                          <li>• Administrative staff</li>
                          <li>• Project coordinators</li>
                          <li>• Support teams</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className={`pt-4 ${theme === 'dark' ? 'border-t border-gray-700' : 'border-t border-slate-100'}`}>
                      <p className={`text-xs italic ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                        "Simplifying complex operations so you can focus on what matters most - saving lives and providing humanitarian aid."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
      
      {/* Footer */}
      <SuperAdminFooter />
    </div>
  );
}