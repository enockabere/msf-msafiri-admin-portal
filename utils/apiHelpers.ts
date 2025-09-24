
export function safeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  return String(value);
}

/**
 * Safely converts API values to numbers
 */
export function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !isNaN(value)) return value;
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Safely converts API values to booleans
 */
export function safeBoolean(
  value: unknown,
  defaultValue: boolean = false
): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return defaultValue;
}

/**
 * Safely converts API tenant_id (which can be string, number, or null)
 */
export function safeTenantId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number") return String(value);
  return null;
}

/**
 * Safely converts API date strings
 */
export function safeDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() !== "") {
    // Validate it's a proper date string
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : value;
  }
  return null;
}

/**
 * Type guard to check if a value is a valid API object
 */
export function isValidApiObject(
  value: unknown
): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
