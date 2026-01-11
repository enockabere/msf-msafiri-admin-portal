import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ConditionalProviders } from "@/components/ConditionalProviders";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ErrorBoundary from "@/components/error-boundary";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="msafiri-theme"
        >
          <ErrorBoundary>
            <div className="relative z-10">
              <ConditionalProviders>{children}</ConditionalProviders>
            </div>
          </ErrorBoundary>
          <Toaster
            position="top-right"
            richColors
            closeButton
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
