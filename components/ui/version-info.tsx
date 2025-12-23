"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getVersionInfo } from "@/lib/version";
import { Info, Calendar, Code, Server } from "lucide-react";

export function VersionInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const versionInfo = getVersionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
          <Info className="w-3 h-3 mr-1" />
          v{versionInfo.version}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Version Information
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Version</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                {versionInfo.version}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Environment</span>
              </div>
              <Badge variant={versionInfo.environment === 'production' ? 'default' : 'outline'}>
                {versionInfo.environment}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Build Date</span>
            </div>
            <p className="text-sm text-gray-600 font-mono">{versionInfo.buildDate}</p>
          </div>
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Updates</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Multi-role authentication system</li>
              <li>• Tenant selection interface</li>
              <li>• Enhanced vetting committee management</li>
              <li>• Temporary password detection</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}