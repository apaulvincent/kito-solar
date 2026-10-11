// src/lib/sanitization.ts

/**
 * Strips HTML markup tags, dangerous control characters, and Unicode direction overrides.
 */
export function stripHtmlAndDangerousChars(input: string): string {
  if (!input) return '';

  return (
    input
      // Remove HTML tags (e.g. <script>, <img ...>, <style>, etc.)
      .replace(/<[^>]*>/g, '')
      // Remove null bytes and non-printable ASCII control characters (excluding newline \n and return \r)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove zero-width spaces, joiners, and Unicode directional overrides (e.g. Right-To-Left override \u202E)
      .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '')
  );
}

/**
 * Sanitizes project title:
 * - Strips all HTML tags and control characters
 * - Converts newlines and tabs to single spaces
 * - Neutralizes pseudo-protocols (e.g., javascript:)
 * - Trims whitespace and collapses multiple spaces
 * - Enforces character limit (default 80)
 */
export function sanitizeProjectTitle(
  title: string | null | undefined,
  maxLength = 80,
  fallback = 'Untitled Solar Project'
): string {
  if (!title) return fallback;

  let cleaned = stripHtmlAndDangerousChars(String(title))
    // Replace newlines, carriage returns, and tabs with single space
    .replace(/[\r\n\t]+/g, ' ')
    // Collapse multiple contiguous spaces
    .replace(/\s+/g, ' ')
    // Strip leading pseudo-protocols
    .replace(/^(javascript|data|vbscript):/gi, '')
    .trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim();
  }

  return cleaned || fallback;
}

/**
 * Sanitizes project notes / site references:
 * - Strips all HTML tags and control characters
 * - Normalizes excessive newlines (max 2 consecutive newlines)
 * - Neutralizes pseudo-protocols
 * - Trims whitespace
 * - Enforces character limit (default 250)
 */
export function sanitizeProjectNotes(
  notes: string | null | undefined,
  maxLength = 250
): string | undefined {
  if (!notes) return undefined;

  let cleaned = stripHtmlAndDangerousChars(String(notes))
    // Normalize line endings to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Limit consecutive newlines to maximum 2
    .replace(/\n{3,}/g, '\n\n')
    // Neutralize dangerous inline pseudo protocols
    .replace(/javascript:/gi, '')
    .trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim();
  }

  return cleaned.length > 0 ? cleaned : undefined;
}
