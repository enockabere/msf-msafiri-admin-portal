"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Monitor,
  Globe,
  Check,
  Settings as SettingsIcon,
  Palette,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [mounted, setMounted] = useState(false);

  // Use effect to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    // Here you would integrate with your i18n solution
    // For now, we'll just store it in localStorage
    localStorage.setItem("preferredLanguage", langCode);

    // Show a notification
    alert(`Language will be changed to ${languages.find(l => l.code === langCode)?.name}. This feature is coming soon!`);
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
            <SettingsIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Customize your portal experience</p>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Theme Appearance</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose how the portal looks to you</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
              Select Theme
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Light Theme */}
              <button
                onClick={() => setTheme("light")}
                className={`p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  theme === "light"
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Sun className={`h-6 w-6 ${theme === "light" ? "text-red-500" : "text-gray-400"}`} />
                  {theme === "light" && (
                    <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Light</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Clean and bright interface</p>
                <div className="mt-3 h-12 rounded-lg bg-white border border-gray-200 flex items-center px-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                  </div>
                </div>
              </button>

              {/* Dark Theme */}
              <button
                onClick={() => setTheme("dark")}
                className={`p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  theme === "dark"
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Moon className={`h-6 w-6 ${theme === "dark" ? "text-red-500" : "text-gray-400"}`} />
                  {theme === "dark" && (
                    <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Dark</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Easy on the eyes</p>
                <div className="mt-3 h-12 rounded-lg bg-gray-900 border border-gray-700 flex items-center px-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                  </div>
                </div>
              </button>

              {/* System Theme */}
              <button
                onClick={() => setTheme("system")}
                className={`p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  theme === "system"
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Monitor className={`h-6 w-6 ${theme === "system" ? "text-red-500" : "text-gray-400"}`} />
                  {theme === "system" && (
                    <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">System</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Match device settings</p>
                <div className="mt-3 h-12 rounded-lg bg-gradient-to-r from-white to-gray-900 border border-gray-400 flex items-center px-3 justify-between">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <Languages className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Language & Region</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Select your preferred language</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
              Portal Language
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    selectedLanguage === lang.code
                      ? "border-red-500 bg-red-50 dark:bg-red-950"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{lang.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{lang.code.toUpperCase()}</p>
                    </div>
                    {selectedLanguage === lang.code && (
                      <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Coming Soon Badge */}
            <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Multi-language Support Coming Soon
                  </h4>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    We're working on bringing full French, Spanish, and Arabic translations to the MSF Portal.
                    Your selection will be saved and applied automatically when available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">About These Settings</h3>
          <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-2">
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
              <span>Your theme preference is saved locally and persists across sessions</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
              <span>System theme automatically switches between light and dark based on your device settings</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
              <span>Language changes will apply to the entire portal interface when fully implemented</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
