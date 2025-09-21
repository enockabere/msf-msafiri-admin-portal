import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  formData: { email: string; password: string };
  onInputChange: (field: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  isLoading: boolean;
  isApiConnected: boolean;
  emailParam?: string;
}

export function LoginForm({
  formData,
  onInputChange,
  onSubmit,
  onForgotPassword,
  isLoading,
  isApiConnected,
  emailParam
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {!isApiConnected && (
        <div className="text-center mb-4">
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            🔴 Server unavailable - Please try Microsoft SSO
          </p>
        </div>
      )}
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={onInputChange("email")}
            placeholder={emailParam || "abereenock95@gmail.com"}
            required
            disabled={isLoading || !isApiConnected}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={onInputChange("password")}
              placeholder="Enter your password"
              required
              disabled={isLoading || !isApiConnected}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !isApiConnected}
          className="w-full h-12 bg-msf-red hover:bg-[#cc0000] text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Sign In
            </>
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </>
  );
}