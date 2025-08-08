/**
 * Utility functions for handling names
 */

/**
 * Parse a full name into first and last name components
 * Handles various edge cases including:
 * - Single names (firstName only)
 * - Multiple middle names (included in lastName)
 * - Empty or null inputs
 * - Extra whitespace
 *
 * @param displayName - The full name to parse
 * @returns Object with firstName and lastName properties
 */
export function parseFullName(displayName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  // Handle null/undefined/empty cases
  const trimmed = displayName?.trim() || '';
  if (!trimmed) {
    return { firstName: 'User', lastName: '' };
  }

  // Split on any whitespace and filter out empty strings
  const parts = trimmed.split(/\s+/).filter(Boolean);

  // Handle single name case
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // First part is firstName, rest is lastName
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}

/**
 * Combine first and last name into a full name
 * @param firstName - The first name
 * @param lastName - The last name
 * @returns The combined full name
 */
export function getFullName(firstName?: string, lastName?: string): string {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';

  if (!first && !last) {
    return '';
  }

  return [first, last].filter(Boolean).join(' ');
}

/**
 * Get initials from a name
 * @param firstName - The first name
 * @param lastName - The last name
 * @returns The initials (e.g., "JD" for "John Doe")
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.trim().charAt(0).toUpperCase() || '';
  const last = lastName?.trim().charAt(0).toUpperCase() || '';

  return first + last;
}
