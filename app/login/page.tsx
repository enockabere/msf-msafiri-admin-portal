import LoginComponent from "./login-component";
import { SessionExpiryHandler } from "@/components/SessionExpiryHandler";

export default function LoginPage() {
  return (
    <>
      <SessionExpiryHandler />
      <LoginComponent />
    </>
  );
}

export const metadata = {
  title: "Sign In | MSF Msafiri Admin Portal",
  description:
    "Sign in to the MSF Msafiri Admin Portal using your Microsoft work account",
};
