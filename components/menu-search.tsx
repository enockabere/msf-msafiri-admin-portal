"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Command, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  section: string;
}

const getMenuItems = (userRoles: string[], isTenantAdmin: boolean, isSuperAdmin: boolean, tenantSlug: string | null): MenuItem[] => {
  const items: MenuItem[] = [];
  
  const hasRealAdminRoles = isTenantAdmin || isSuperAdmin || 
    userRoles.some(role => ['SUPER_ADMIN', 'super_admin', 'MT_ADMIN', 'mt_admin', 'HR_ADMIN', 'hr_admin', 'EVENT_ADMIN', 'event_admin'].includes(role));
  
  const isVettingCommitteeOnly = userRoles.some(role => ['vetting_committee', 'VETTING_COMMITTEE'].includes(role)) && !hasRealAdminRoles;
  const isApproverOnly = userRoles.some(role => ['vetting_approver', 'VETTING_APPROVER'].includes(role)) && !hasRealAdminRoles;

  const basePath = tenantSlug ? `/tenant/${tenantSlug}` : '';

  // Overview
  items.push({ label: "Dashboard", href: `${basePath}/dashboard`, icon: "🏠", section: "Overview" });

  if (!isVettingCommitteeOnly && !isApproverOnly) {
    // Operations
    items.push({ label: "Event Management", href: `${basePath}/events`, icon: "📅", section: "Operations" });
    items.push({ label: "Visitor Accommodations", href: `${basePath}/accommodation`, icon: "🏨", section: "Operations" });
    items.push({ label: "Transport Management", href: `${basePath}/transport`, icon: "🚗", section: "Operations" });
    items.push({ label: "Vendor Hotels", href: `${basePath}/vendor-hotels`, icon: "🏨", section: "Setups" });
    items.push({ label: "Guest House Setup", href: `${basePath}/guest-house-setup`, icon: "🏠", section: "Setups" });
    items.push({ label: "Stationary & Equipment", href: `${basePath}/inventory`, icon: "📦", section: "Setups" });
    items.push({ label: "Travel Requirements", href: `${basePath}/travel-requirements`, icon: "✈️", section: "Setups" });
    items.push({ label: "Transport Setup", href: `${basePath}/transport-setup`, icon: "🚗", section: "Setups" });
    items.push({ label: "Code of Conduct", href: `${basePath}/code-of-conduct`, icon: "📋", section: "Setups" });
    items.push({ label: "Certificate Design", href: `${basePath}/setups/certificates`, icon: "🏆", section: "Setups" });
    items.push({ label: "LOI Design", href: `${basePath}/setups/invitations`, icon: "✉️", section: "Setups" });
    items.push({ label: "Badge Design", href: `${basePath}/setups/badges`, icon: "🏆", section: "Setups" });
  } else {
    items.push({ label: "Event Management", href: `${basePath}/events`, icon: "📅", section: "Operations" });
  }

  // Communication
  items.push({ label: "Notifications", href: `${basePath}/notifications`, icon: "🔔", section: "Communication" });
  items.push({ label: "Useful Contacts", href: `${basePath}/useful-contacts`, icon: "👤", section: "Communication" });
  
  if (!isVettingCommitteeOnly && !isApproverOnly) {
    items.push({ label: "News & Updates", href: `${basePath}/news-updates`, icon: "📰", section: "Communication" });
    items.push({ label: "System Settings", href: `${basePath}/settings`, icon: "⚙️", section: "System" });
  }

  if (isSuperAdmin || isTenantAdmin) {
    items.push({ label: "Admin Users", href: `${basePath}/admin-users`, icon: "👥", section: "User Management" });
  }

  return items;
};

interface MenuSearchProps {
  className?: string;
}

export function MenuSearch({ className }: MenuSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isSuperAdmin } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isTenantPath = pathname?.startsWith('/tenant/');
  const tenantSlugMatch = pathname?.match(/\/tenant\/([^/]+)/);
  const tenantSlug = tenantSlugMatch ? tenantSlugMatch[1] : null;

  const menuItems = useMemo(() => 
    getMenuItems(user?.role ? [user.role] : [], false, isSuperAdmin, tenantSlug),
    [user?.role, isSuperAdmin, tenantSlug]
  );

  useEffect(() => {
    if (query.trim()) {
      const filtered = menuItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.section.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredItems(filtered);
      setSelectedIndex(0);
      setIsOpen(true);
    } else {
      setFilteredItems([]);
      setIsOpen(false);
    }
  }, [query, menuItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleItemClick(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleItemClick = (item: MenuItem) => {
    router.push(item.href);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search menus..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="pl-10 w-64 h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <Command className="h-3 w-3" />
            K
          </kbd>
        </div>
      </div>

      {isOpen && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                {section}
              </div>
              {items.map((item, index) => {
                const globalIndex = filteredItems.indexOf(item);
                return (
                  <button
                    key={item.href}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-b-0 ${
                      globalIndex === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-gray-900 dark:text-white">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}