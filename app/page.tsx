import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to login page as the landing page
  redirect("/login");
}

export const metadata = {
  title: "MSF Msafiri Admin Portal",
  description: "Comprehensive admin portal for MSF Kenya operations management",
};
