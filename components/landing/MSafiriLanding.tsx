import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MSafiriLanding() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-10 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-slate-900 rounded-sm flex items-center justify-center text-white">
            {/* Simple logo placeholder */}
            MS
          </div>
          MSafiri
        </div>

        <NavigationMenu>
          <NavigationMenuList className="hidden md:flex gap-4">
            {["Events", "Travel", "Accommodation", "Resources", "About Us"].map((item) => (
              <NavigationMenuItem key={item}>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {item}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <Button variant="outline" className="rounded-full px-6 border-slate-300">
          Request demo
        </Button>
      </header>

      {/* Sub-navigation / Tabs Section */}
      <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50">
        <Tabs defaultValue="events" className="w-full">
          <div className="flex items-center gap-8">
            {/* Small decorative indicators from the image */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-900" />
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <div className="w-3 h-3 rounded-full bg-slate-300" />
            </div>
            
            <TabsList className="bg-transparent gap-6">
              <TabsTrigger value="events" className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none bg-transparent shadow-none px-0">
                Events
              </TabsTrigger>
              <TabsTrigger value="travel" className="bg-transparent shadow-none px-0">
                Travel Management
              </TabsTrigger>
              <TabsTrigger value="accommodation" className="bg-transparent shadow-none px-0">
                Accommodation <span className="ml-1 text-[10px]">▼</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Hero Section */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-12 px-10 py-20 items-center max-w-7xl mx-auto">
        {/* Text Content */}
        <div className="space-y-8">
          <h1 className="text-5xl lg:text-6xl font-serif leading-tight text-slate-900">
            Streamline your MSF operations with <span className="text-slate-400">intelligent visitor and event management</span>
          </h1>
          
          <p className="text-slate-500 text-lg max-w-md leading-relaxed">
            Manage tenants, streamline event planning, invite and track visitors, allocate rooms and transport—all in one secure platform.
          </p>

          <div className="flex gap-4 pt-4">
            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 py-6 text-md">
              Get Started
            </Button>
            <Button variant="outline" className="rounded-full px-8 py-6 text-md border-slate-200">
              Learn More
            </Button>
          </div>
        </div>

        {/* Visual Content (Illustration Placeholder) */}
        <div className="relative aspect-square bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
           {/* You would place your SVG or Image component here */}
           <div className="text-slate-300 font-mono text-sm uppercase tracking-widest text-center px-10">
              [ MSF Operations Visualization ]
              <p className="text-[10px] mt-2 text-slate-400">Event & Travel Management Dashboard</p>
           </div>
           
           {/* Decorative floating card mimicking the image */}
           <div className="absolute bottom-12 right-12 w-48 h-32 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl p-4 hidden md:block">
              <div className="w-full h-2 bg-slate-100 rounded mb-2" />
              <div className="w-2/3 h-2 bg-slate-100 rounded" />
           </div>
        </div>
      </main>
    </div>
  );
}