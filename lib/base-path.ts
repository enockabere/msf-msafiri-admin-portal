/**
 * Utility for handling Next.js base path in API routes
 */

// Get the Next.js base path for internal API routes
export const getBasePath = (): string => {
  return process.env.NEXT_PUBLIC_BASE_PATH || "/portal";
};

// Helper function for internal Next.js API routes (prepend base path)
export const getInternalApiUrl = (endpoint: string): string => {
  const basePath = getBasePath();
  return `${basePath}${endpoint}`;
};
