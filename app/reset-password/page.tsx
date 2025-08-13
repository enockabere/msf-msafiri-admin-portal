import { Suspense } from "react";
import ResetPasswordComponent from "./reset-password-component";
import { Loader2 } from "lucide-react";

// Loading component for Suspense
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm border shadow-xl rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading password reset...</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordComponent />
    </Suspense>
  );
}

export const metadata = {
  title: "Reset Password | MSF Msafiri Admin Portal",
  description: "Reset your password for the MSF Msafiri Admin Portal",
};