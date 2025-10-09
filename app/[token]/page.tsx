"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TokenRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  useEffect(() => {
    // Check if this looks like a UUID token (QR code token format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (token && uuidRegex.test(token)) {
      // Redirect to the public QR scan page
      router.replace(`/public/qr/${token}`);
    } else {
      // Not a valid token, redirect to home
      router.replace('/');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}