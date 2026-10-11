// src/lib/__tests__/sanitization.test.ts
import { describe, it, expect } from 'vitest';
import {
  stripHtmlAndDangerousChars,
  sanitizeProjectTitle,
  sanitizeProjectNotes,
} from '../sanitization';

describe('Sanitization Security Suite', () => {
  describe('stripHtmlAndDangerousChars', () => {
    it('strips script and html tags', () => {
      const malicious = '<script>alert("xss")</script>Solar Roof Project';
      expect(stripHtmlAndDangerousChars(malicious)).toBe('alert("xss")Solar Roof Project');
    });

    it('strips image onerror tags', () => {
      const imgTag = '<img src="x" onerror="stealCookies()"/>Villa Sizing';
      expect(stripHtmlAndDangerousChars(imgTag)).toBe('Villa Sizing');
    });

    it('removes null bytes and control characters', () => {
      const withNull = 'Project\x00Name\x08With\x1FControlChars';
      expect(stripHtmlAndDangerousChars(withNull)).toBe('ProjectNameWithControlChars');
    });

    it('removes unicode right-to-left directional override chars', () => {
      const bdo = 'SafeTitle\u202Ereversed';
      expect(stripHtmlAndDangerousChars(bdo)).toBe('SafeTitlereversed');
    });
  });

  describe('sanitizeProjectTitle', () => {
    it('strips html tags and trims whitespace', () => {
      const input = '   <h1>Commercial Array</h1>   ';
      expect(sanitizeProjectTitle(input)).toBe('Commercial Array');
    });

    it('collapses multi-line strings into a single line', () => {
      const input = "Line 1\nLine 2\r\nLine 3\tTabbed";
      expect(sanitizeProjectTitle(input)).toBe('Line 1 Line 2 Line 3 Tabbed');
    });

    it('enforces maxLength truncation at 80 characters by default', () => {
      const longTitle = 'A'.repeat(120);
      const sanitized = sanitizeProjectTitle(longTitle);
      expect(sanitized.length).toBe(80);
      expect(sanitized).toBe('A'.repeat(80));
    });

    it('uses fallback when title is empty or only whitespace', () => {
      expect(sanitizeProjectTitle('')).toBe('Untitled Solar Project');
      expect(sanitizeProjectTitle('   ')).toBe('Untitled Solar Project');
      expect(sanitizeProjectTitle(null)).toBe('Untitled Solar Project');
      expect(sanitizeProjectTitle('<script></script>')).toBe('Untitled Solar Project');
    });

    it('neutralizes pseudo-protocols', () => {
      expect(sanitizeProjectTitle('javascript:alert(1)')).toBe('alert(1)');
    });
  });

  describe('sanitizeProjectNotes', () => {
    it('strips html tags from notes', () => {
      const input = '<p>2-story metal roof</p><script>evil()</script>';
      expect(sanitizeProjectNotes(input)).toBe('2-story metal roofevil()');
    });

    it('normalizes excessive newlines to a maximum of two', () => {
      const input = 'Header\n\n\n\n\nParagraph 2';
      expect(sanitizeProjectNotes(input)).toBe('Header\n\nParagraph 2');
    });

    it('enforces maxLength truncation at 250 characters by default', () => {
      const longNotes = 'B'.repeat(300);
      const sanitized = sanitizeProjectNotes(longNotes);
      expect(sanitized?.length).toBe(250);
      expect(sanitized).toBe('B'.repeat(250));
    });

    it('returns undefined if notes are empty or only contains whitespace/tags', () => {
      expect(sanitizeProjectNotes('')).toBeUndefined();
      expect(sanitizeProjectNotes('   ')).toBeUndefined();
      expect(sanitizeProjectNotes(null)).toBeUndefined();
      expect(sanitizeProjectNotes(undefined)).toBeUndefined();
      expect(sanitizeProjectNotes('<script></script>')).toBeUndefined();
    });
  });
});
