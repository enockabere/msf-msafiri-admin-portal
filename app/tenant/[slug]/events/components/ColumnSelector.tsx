"use client";

import { Button } from "@/components/ui/button";
import { Columns3, Check } from "lucide-react";
import { useEffect, useRef } from "react";

interface ColumnSelectorProps {
  availableColumns: Record<string, string>;
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: (columns: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean) => void;
}

export function ColumnSelector({
  availableColumns,
  visibleColumns,
  setVisibleColumns,
  showColumnSelector,
  setShowColumnSelector,
}: ColumnSelectorProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const totalCount = Object.keys(availableColumns).length;

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnSelector(false);
      }
    };

    if (showColumnSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnSelector, setShowColumnSelector]);

  // Calculate dropdown position to prevent overflow
  const getDropdownPosition = () => {
    if (typeof window === 'undefined') return 'right-0';
    
    const screenWidth = window.innerWidth;
    if (screenWidth < 640) return 'right-0 left-0'; // Full width on mobile
    if (screenWidth < 1024) return 'left-0'; // Left aligned on tablet to prevent cutoff
    return 'left-0'; // Left aligned on desktop to prevent cutoff
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="h-10 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm font-medium"
        onClick={() => setShowColumnSelector(!showColumnSelector)}
      >
        <Columns3 className="h-4 w-4 mr-2" />
        Columns
        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
          {visibleCount}/{totalCount}
        </span>
      </Button>
      
      {showColumnSelector && (
        <div className={`absolute top-full mt-1 w-full sm:w-80 md:w-96 lg:w-80 bg-white border border-gray-200 shadow-xl rounded-lg z-[9999] ${getDropdownPosition()}`}>
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-900 text-sm">Show/Hide Columns</h4>
            <p className="text-xs text-gray-500 mt-1">
              Select which columns to display in the table
            </p>
          </div>
          <div className="p-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {Object.entries(availableColumns).map(([key, label]) => {
              const isVisible = visibleColumns[key] || false;
              return (
                <div 
                  key={key} 
                  className="flex items-center gap-3 px-2 sm:px-3 py-2 text-sm hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setVisibleColumns(prev => ({
                      ...prev,
                      [key]: !isVisible
                    }));
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      isVisible 
                        ? 'bg-red-600 border-red-600' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isVisible && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                  <span className={`flex-1 text-xs sm:text-sm truncate cursor-pointer ${
                    isVisible ? 'text-gray-900 font-medium' : 'text-gray-600'
                  }`} title={label}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="p-2 sm:p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setVisibleColumns(Object.keys(availableColumns).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
                }}
                className="flex-1 h-8 text-xs bg-white border-gray-200 hover:bg-gray-50"
              >
                Show All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setVisibleColumns(Object.keys(availableColumns).reduce((acc, key) => ({ ...acc, [key]: key === 'full_name' || key === 'email' || key === 'status' }), {}));
                }}
                className="flex-1 h-8 text-xs bg-white border-gray-200 hover:bg-gray-50"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}