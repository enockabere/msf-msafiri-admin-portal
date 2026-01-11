"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[9999] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-red-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div>
          <p className="text-base font-medium text-gray-900 dark:text-white">{message}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the data</p>
        </div>
      </div>
    </div>
  );
}

export function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
        const url = new URL(link.href);
        if (url.pathname !== pathname && url.origin === window.location.origin) {
          setLoading(true);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!loading) return null;

  return <LoadingScreen message="Loading page..." />;
}