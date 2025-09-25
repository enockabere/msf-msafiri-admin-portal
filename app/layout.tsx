import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { TenantProvider } from "@/context/TenantContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import SessionTimeoutHandler from "@/components/auth/SessionTimeoutHandler";
import { ToastContainer } from "@/components/ui/toast";
import { NavigationLoader } from "@/components/ui/loading";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MSF Admin Portal",
  description: "MSF Msafiri Admin Dashboard",
  icons: {
    icon: "/icon/MSF_Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiase`}>
        {/* Content on top */}
        <div className="relative z-10">
          <SessionProvider>
            <TenantProvider>
              <SidebarProvider>
                <SessionTimeoutHandler />
                <NavigationLoader />
                {children}
                <ToastContainer />
              </SidebarProvider>
            </TenantProvider>
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
