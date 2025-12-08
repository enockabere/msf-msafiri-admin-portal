import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Event Registration - MSF",
  description: "Register for MSF Events",
  icons: {
    icon: "/portal/icon/MSF_Logo.png",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
      />
    </>
  );
}
