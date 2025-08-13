"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTenant } from "@/context/TenantContext";
import { Tenant } from "@/lib/api";

interface TenantSelectorProps {
  className?: string;
}

export function TenantSelector({ className = "" }: TenantSelectorProps) {
  const {
    selectedTenant,
    tenants,
    loading,
    isAllTenantsSelected,
    setSelectedTenant,
    setAllTenantsSelected,
    refreshTenants,
  } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAllTenantsSelect = () => {
    setAllTenantsSelected();
    setIsOpen(false);
  };

  const handleTenantSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedTenant(null);
    setIsOpen(false);
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshTenants();
  };

  if (loading && tenants.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span className="text-sm text-gray-500">Loading tenants...</span>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No tenants available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-w-[200px]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center space-x-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="truncate">
            {isAllTenantsSelected
              ? "All Tenants"
              : selectedTenant
              ? selectedTenant.name
              : "Select Tenant"}
          </span>
        </div>
        <svg
          className="w-4 h-4 ml-2 -mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-72 mt-2 origin-top-right bg-white border border-gray-300 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <div className="px-3 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Select Tenant
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Refresh tenants"
                >
                  <svg
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {/* All Tenants Option */}
              <button
                onClick={handleAllTenantsSelect}
                className={`flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  isAllTenantsSelected
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-900"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">All Tenants</p>
                      <p className="text-xs text-gray-500">
                        View data across all tenant organizations
                      </p>
                    </div>
                  </div>
                </div>
                {isAllTenantsSelected && (
                  <svg
                    className="w-4 h-4 ml-2 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Divider */}
              {tenants.length > 0 && (
                <div className="border-t border-gray-200 my-1"></div>
              )}

              {/* Clear Selection Option */}
              {(selectedTenant || isAllTenantsSelected) && (
                <button
                  onClick={handleClearSelection}
                  className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear Selection
                </button>
              )}

              {/* Individual Tenants */}
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleTenantSelect(tenant)}
                  className={`flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    selectedTenant?.id === tenant.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-900"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          tenant.is_active ? "bg-green-400" : "bg-gray-400"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{tenant.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {tenant.slug} • {tenant.contact_email}
                        </p>
                      </div>
                    </div>
                    {tenant.description && (
                      <p className="mt-1 text-xs text-gray-500 truncate">
                        {tenant.description}
                      </p>
                    )}
                  </div>
                  {selectedTenant?.id === tenant.id && (
                    <svg
                      className="w-4 h-4 ml-2 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {(selectedTenant || isAllTenantsSelected) && (
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  {isAllTenantsSelected ? (
                    <span>
                      Selected: <span className="font-medium">All Tenants</span>
                    </span>
                  ) : selectedTenant ? (
                    <>
                      Selected:{" "}
                      <span className="font-medium">{selectedTenant.name}</span>
                      {selectedTenant.domain && (
                        <span className="block">
                          Domain: {selectedTenant.domain}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
