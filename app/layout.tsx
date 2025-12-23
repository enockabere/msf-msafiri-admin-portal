import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ConditionalProviders } from "@/components/ConditionalProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MSF Admin Portal",
  description: "MSF Msafiri Admin Dashboard",
  icons: {
    icon: "/portal/icon/MSF_Logo.png",
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
        <div className="relative z-10">
          <ConditionalProviders>{children}</ConditionalProviders>
        </div>
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
