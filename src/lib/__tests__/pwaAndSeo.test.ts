import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA & SEO Configuration Suite', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const manifestPath = path.join(rootDir, 'public', 'site.webmanifest');
  const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
  const robotsPath = path.join(rootDir, 'public', 'robots.txt');
  const htmlPath = path.join(rootDir, 'index.html');

  it('provides a valid web manifest with standalone PWA properties', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    expect(manifest.name).toBe('Kito Solar - Photovoltaic & Electrical Sizing Studio');
    expect(manifest.short_name).toBe('Kito Solar');
    expect(manifest.start_url).toBe('/tool');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#F59E0B');
    expect(manifest.background_color).toBe('#090D16');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.icons[0].src).toBe('/solar-logo.svg');
  });

  it('provides a sitemap.xml with all primary public engineering routes', () => {
    expect(fs.existsSync(sitemapPath)).toBe(true);
    const content = fs.readFileSync(sitemapPath, 'utf-8');

    const expectedRoutes = [
      'https://kitosolar.pvdeo.com/',
      'https://kitosolar.pvdeo.com/tool',
      'https://kitosolar.pvdeo.com/load-calculator',
      'https://kitosolar.pvdeo.com/solar-mapper',
      'https://kitosolar.pvdeo.com/financial-roi',
      'https://kitosolar.pvdeo.com/yield-simulator',
      'https://kitosolar.pvdeo.com/contact',
    ];

    for (const route of expectedRoutes) {
      expect(content).toContain(`<loc>${route}</loc>`);
    }
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it('references sitemap.xml in robots.txt', () => {
    expect(fs.existsSync(robotsPath)).toBe(true);
    const content = fs.readFileSync(robotsPath, 'utf-8');
    expect(content).toContain('Sitemap: https://kitosolar.pvdeo.com/sitemap.xml');
  });

  it('links the manifest and mobile meta tags in index.html without em-dashes', () => {
    expect(fs.existsSync(htmlPath)).toBe(true);
    const content = fs.readFileSync(htmlPath, 'utf-8');

    expect(content).toContain('href="/site.webmanifest"');
    expect(content).toContain('name="theme-color" content="#F59E0B"');
    expect(content).toContain('rel="apple-touch-icon"');
    expect(content).not.toContain('—'); // Strictly avoid em dashes in HTML title and copy
  });
});
