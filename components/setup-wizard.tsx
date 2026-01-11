"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2 } from "lucide-react";

interface SetupWizardProps {
  onDismiss: () => void;
}

export function SetupWizard({ onDismiss }: SetupWizardProps) {
  const handleFinish = () => {
    onDismiss();
  };

  return (
    <div className="w-full max-h-[85vh] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="relative p-8 pb-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                <span className="text-2xl">🚀</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Before Creating Your First Event
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Here's what you need to set up to ensure smooth event management
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#9CA3AF #F3F4F6'
      }}>
        <div className="p-8 space-y-8">
          {/* Essential Requirements */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-lg font-bold">★</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Essential Requirements
              </h3>
            </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="group p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">
                    Accommodation Setup
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                    Configure vendor hotels and guest house facilities for visitor stays. This ensures participants have proper accommodation during events.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Transport Configuration
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                    Set up transport options and providers for participant movement. Essential for coordinating arrivals and departures.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50 hover:shadow-lg transition-all duration-200 lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">
                    Travel Requirements
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                    Define travel policies and requirements for event participants. This includes visa requirements, travel documentation, and approval processes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Additions */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 text-lg">+</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recommended Additions
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Inventory & Equipment
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Set up stationary and equipment items for events. Helps track resources and materials needed for successful events.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Certificates & Documents
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Design certificates, invitations, and code of conduct templates. Provides professional documentation for participants.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 pt-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="px-6 py-2 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            I'll do this later
          </Button>
          
          <Button
            onClick={handleFinish}
            className="px-8 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Got it, thanks!
          </Button>
        </div>
      </div>
    </div>
  );