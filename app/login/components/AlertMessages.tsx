import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface AlertMessagesProps {
  error?: string;
  success?: string;
  message?: string;
}

export function AlertMessages({ error, success, message }: AlertMessagesProps) {
  if (!error && !success) return null;

  return (
    <>
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert
          className={
            message === "email-changed" || message === "password-reset"
              ? "border-blue-200 bg-blue-50"
              : "border-green-200 bg-green-50"
          }
        >
          <CheckCircle
            className={`h-4 w-4 ${
              message === "email-changed" || message === "password-reset"
                ? "text-blue-600"
                : "text-green-600"
            }`}
          />
          <AlertDescription
            className={
              message === "email-changed" || message === "password-reset"
                ? "text-blue-800"
                : "text-green-800"
            }
          >
            {success}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}