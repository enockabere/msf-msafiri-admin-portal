"use client";

import { Button } from "@/components/ui/button";

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
  return (
    <div className="relative column-selector">
      <Button
        onClick={() => setShowColumnSelector(!showColumnSelector)}
        variant="outline"
        className="border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Column Filter
      </Button>
      {showColumnSelector && (
        <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg p-3 z-10 min-w-48">
          <div className="text-sm font-medium mb-2">Show/Hide Columns</div>
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(availableColumns).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={visibleColumns[key] || false}
                  onChange={(e) => setVisibleColumns(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}