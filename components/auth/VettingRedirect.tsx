"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function VettingRedirect() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role === "VETTING_COMMITTEE") {
      router.replace("/vetting");
    }
  }, [session, router]);

  return null;
}