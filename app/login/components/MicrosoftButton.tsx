import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Microsoft icon as SVG component
const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
  </svg>
);

interface MicrosoftButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function MicrosoftButton({ onClick, isLoading }: MicrosoftButtonProps) {
  return (
    <>
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Microsoft SSO Button */}
      <Button
        onClick={onClick}
        disabled={isLoading}
        variant="outline"
        className="w-full h-12 border-gray-300 hover:bg-gray-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <MicrosoftIcon className="w-4 h-4 mr-2" />
            Sign in with Microsoft
          </>
        )}
      </Button>
    </>
  );
}