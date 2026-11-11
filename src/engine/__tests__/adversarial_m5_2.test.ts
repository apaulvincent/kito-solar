import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculateMounting } from '../calculateMounting';
import { CadDimensionDrawing } from '@/components/results/MountingCadDiagram';

describe('Adversarial Verification — Milestone 5 Challenger Suite', () => {
  describe('1. calculateMounting Contract & Stress Testing', () => {
    it('satisfies authoritative contract for 10 modules in 2 strings', () => {
      const bom = calculateMounting(10, 2);

      // Contract checks
      expect(bom.panelCount).toBe(10);
      expect(bom.items).toHaveLength(6);
      expect(bom.totalEndClamps).toBe(8); // 2 rows * 4
      expect(bom.totalMidClamps).toBe(16); // 2 * (10 - 2)
      expect(bom.totalMc4Pairs).toBe(4); // max(2, 2 * 2)
      expect(bom.totalRails).toBeGreaterThanOrEqual(10);

      // Key ordering verification
      const keys = bom.items.map((i) => i.key);
      expect(keys).toEqual([
        'roof_rail',
        'rail_splice',
        'l_foot',
        'mid_clamp',
        'end_clamp',
        'grounding_lug',
      ]);

      // Quantity invariants
      expect(bom.totalRails).toBe(11); // Math.ceil((10 * 1.134 * 2) / 2.2) = 11
      expect(bom.totalSplices).toBe(7); // 11 - 4 = 7
      expect(bom.totalLFeet).toBe(28); // Math.round(11 * 2.5) = 28
      
      const groundingLugItem = bom.items.find((i) => i.key === 'grounding_lug');
      expect(groundingLugItem).toBeDefined();
      expect(groundingLugItem?.quantity).toBe(11); // 4 lugs (2 per row) + 7 jumpers
      expect(groundingLugItem?.unit).toBe('sets');

      // Schema completeness on all 6 items
      bom.items.forEach((item) => {
        expect(item.key).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.unit).toBeTruthy();
        expect(item.specification).toBeTruthy();
        expect(item.explanation).toBeTruthy();
        expect(item.calculationBasis).toBeTruthy();
        expect(item.imagePath).toBeTruthy();
        expect(item.material).toBeTruthy();
        expect(item.finish).toBeTruthy();
        expect(item.standards).toBeDefined();
        expect(item.standards?.length).toBeGreaterThan(0);
        expect(item.dimensions).toBeDefined();
        expect(item.dimensions?.lengthMm).toBeGreaterThan(0);
        expect(item.dimensions?.widthMm).toBeGreaterThan(0);
        expect(item.dimensions?.heightMm).toBeGreaterThan(0);
        expect(item.dimensions?.thicknessMm).toBeGreaterThan(0);
        expect(item.dimensions?.fastenerSpec).toBeTruthy();
        expect(item.dimensions?.torqueNm).toBeTruthy();
      });
    });

    it('survives boundary cases: single module, single string', () => {
      const bom = calculateMounting(1, 1);
      expect(bom.panelCount).toBe(1);
      expect(bom.totalEndClamps).toBe(4); // 1 row * 4
      expect(bom.totalMidClamps).toBe(0); // 2 * (1 - 1) = 0
      expect(bom.totalRails).toBe(2); // min 2 rails
      expect(bom.totalSplices).toBe(0); // 2 - 2 = 0
      expect(bom.totalMc4Pairs).toBe(2); // min 2
      expect(bom.items).toHaveLength(6);
      expect(Number.isFinite(bom.totalLFeet)).toBe(true);
      expect(bom.totalLFeet).toBeGreaterThanOrEqual(4);
    });

    it('survives extreme and non-positive boundary conditions without NaN or crashes', () => {
      const zeroBom = calculateMounting(0, 0);
      expect(zeroBom.panelCount).toBe(1); // clamped to Math.max(1, 0)
      expect(zeroBom.items).toHaveLength(6);
      expect(Number.isNaN(zeroBom.totalEndClamps)).toBe(false);
      expect(Number.isNaN(zeroBom.totalMidClamps)).toBe(false);
      expect(Number.isNaN(zeroBom.totalRails)).toBe(false);

      const negativeBom = calculateMounting(-5, -2);
      expect(negativeBom.panelCount).toBe(1);
      expect(negativeBom.items).toHaveLength(6);
      expect(negativeBom.totalEndClamps).toBe(4);

      const massiveBom = calculateMounting(1000, 20);
      expect(massiveBom.panelCount).toBe(1000);
      expect(massiveBom.totalEndClamps).toBe(80); // 20 * 4
      expect(massiveBom.totalMidClamps).toBe(2 * (1000 - 20)); // 1960
      expect(massiveBom.totalMc4Pairs).toBe(40);
      expect(massiveBom.items).toHaveLength(6);
      massiveBom.items.forEach((item) => {
        expect(Number.isFinite(item.quantity)).toBe(true);
        expect(item.quantity).toBeGreaterThan(0);
      });
    });

    it('maintains monotonic growth of rails and mid-clamps as panel count increases', () => {
      let prevRails = 0;
      let prevMidClamps = 0;
      for (let panels = 2; panels <= 30; panels += 2) {
        const bom = calculateMounting(panels, 2);
        expect(bom.totalRails).toBeGreaterThanOrEqual(prevRails);
        expect(bom.totalMidClamps).toBeGreaterThanOrEqual(prevMidClamps);
        prevRails = bom.totalRails;
        prevMidClamps = bom.totalMidClamps;
      }
    });
  });

  describe('2. Hardware Asset Existence and Valid SVG Format', () => {
    const accessoriesDir = path.resolve(process.cwd(), 'public/assets/accessories');
    const requiredAssets = [
      'roof-rail.svg',
      'rail-splice.svg',
      'l-foot.svg',
      'mid-clamp.svg',
      'end-clamp.svg',
      'grounding-lug.svg',
    ];

    requiredAssets.forEach((assetFile) => {
      it(`verifies ${assetFile} exists, is valid SVG XML, and non-empty`, () => {
        const fullPath = path.join(accessoriesDir, assetFile);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf8').trim();
        expect(content.length).toBeGreaterThan(1000); // realistic vector content
        expect(content.startsWith('<svg')).toBe(true);
        expect(content.endsWith('</svg>')).toBe(true);
        expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(content).toContain('viewBox=');

        // Verify XML tag balance
        const openTags: string[] = [];
        const tagRegex = /<\/?([a-zA-Z0-9:-]+)[^>]*\/?>/g;
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
          const fullTag = match[0];
          const tagName = match[1];
          if (fullTag.endsWith('/>')) {
            // self closing
          } else if (fullTag.startsWith('</')) {
            const last = openTags.pop();
            expect(last).toBe(tagName);
          } else if (!fullTag.startsWith('<?') && !fullTag.startsWith('<!')) {
            openTags.push(tagName);
          }
        }
        expect(openTags).toHaveLength(0);
      });
    });
  });

  describe('3. Dimensional CAD Vector Blueprints Coverage', () => {
    const keys = [
      { key: 'roof_rail', expectedSpec: '28.0 mm' },
      { key: 'rail_splice', expectedSpec: '150.0 mm' },
      { key: 'l_foot', expectedSpec: '84.0 mm' },
      { key: 'mid_clamp', expectedSpec: '40.0 mm Clamping Span' },
      { key: 'end_clamp', expectedSpec: '40.0 mm Width' },
      { key: 'grounding_lug', expectedSpec: '32.0 mm Lug Body' },
    ];

    it('renders distinct CAD vector SVG blueprints with millimeter dimensions for all 6 mounting accessories', () => {
      keys.forEach(({ key, expectedSpec }) => {
        const html = renderToStaticMarkup(createElement(CadDimensionDrawing, { itemKey: key }));
        expect(html).toContain('<svg');
        expect(html).toContain(expectedSpec);
      });
    });
  });
});
