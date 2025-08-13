import { Suspense } from "react";
import LoginComponent from "./login-component";
import { SessionExpiryHandler } from "@/components/SessionExpiryHandler";
import { Loader2 } from "lucide-react";

// Loading component for Suspense
function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm border shadow-xl rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading login page...</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <SessionExpiryHandler />
      <Suspense fallback={<LoginLoading />}>
        <LoginComponent />
      </Suspense>
    </>
  );
}

export const metadata = {
  title: "Sign In | MSF Msafiri Admin Portal",
  description:
    "Sign in to the MSF Msafiri Admin Portal using your Microsoft work account",
};
