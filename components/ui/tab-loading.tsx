"use client";

export function TabLoading() {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="mb-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
        <div className="h-4 bg-gray-100 rounded animate-pulse w-64"></div>
      </div>
      
      <div className="space-y-4">
        {/* Search and Export skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse"></div>
        </div>

        {/* Table skeleton */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50">
            <div className="flex">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="px-4 py-3 flex-1">
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Results info skeleton */}
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}