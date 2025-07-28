import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, Admin
          </h1>
          <p className="text-gray-600 text-sm">
            Here&apos;s what&apos;s happening with MSF Msafiri operations today
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              5
            </Badge>
          </Button>
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-msf text-white font-semibold">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-semibold text-gray-900">John Doe</p>
              <p className="text-gray-500">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
