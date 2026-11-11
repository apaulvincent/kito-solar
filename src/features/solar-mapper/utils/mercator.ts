import { BasemapProvider } from '../types/solarMapper';

export const TILE_SIZE = 256;

export interface BasemapOption {
  id: BasemapProvider;
  name: string;
  badge: string;
  description: string;
}

export const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'google_satellite',
    name: 'Google Satellite (HD)',
    badge: 'Ultra-Res • 20x',
    description: 'Updated high-resolution aerial & satellite imagery across the Philippines.',
  },
  {
    id: 'google_hybrid',
    name: 'Google Hybrid',
    badge: 'Satellite + Roads',
    description: 'Google satellite with street names, barangay borders, and landmarks.',
  },
  {
    id: 'esri_satellite',
    name: 'Esri World Imagery',
    badge: 'Global Survey',
    description: 'ArcGIS survey imagery (native capped at 18x to prevent missing tiles).',
  },
  {
    id: 'osm_streets',
    name: 'OpenStreetMap Streets',
    badge: 'Cadastral & Roads',
    description: 'Clear vector road network and property boundaries.',
  },
];

export function getTileUrl(provider: BasemapProvider, x: number, y: number, z: number): string {
  switch (provider) {
    case 'google_hybrid':
      return `https://mt${(x + y) % 4}.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;
    case 'esri_satellite':
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    case 'osm_streets':
      return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    case 'google_satellite':
    default:
      return `https://mt${(x + y) % 4}.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
  }
}

export function getMaxNativeZoom(provider: BasemapProvider): number {
  switch (provider) {
    case 'esri_satellite':
      return 18;
    case 'osm_streets':
      return 19;
    case 'google_satellite':
    case 'google_hybrid':
    default:
      return 20;
  }
}

export function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

export function latToTileY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

export function tileXToLng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

export function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export interface VisibleTile {
  key: string;
  x: number;
  y: number;
  px: number;
  py: number;
  size: number;
  url: string;
}

export function computeVisibleTiles(params: {
  basemapProvider: BasemapProvider;
  tileZoom: number;
  scaledTileSize: number;
  centerTileX: number;
  centerTileY: number;
  width: number;
  height: number;
}): VisibleTile[] {
  const { basemapProvider, tileZoom, scaledTileSize, centerTileX, centerTileY, width, height } = params;
  const tilesAcross = Math.ceil(width / scaledTileSize) + 4;
  const tilesDown = Math.ceil(height / scaledTileSize) + 4;

  const startTileX = Math.floor(centerTileX - tilesAcross / 2);
  const startTileY = Math.floor(centerTileY - tilesDown / 2);

  const tiles: VisibleTile[] = [];
  const maxTile = Math.pow(2, tileZoom);

  for (let ty = 0; ty <= tilesDown; ty++) {
    for (let tx = 0; tx <= tilesAcross; tx++) {
      const curX = ((startTileX + tx) % maxTile + maxTile) % maxTile;
      const curY = startTileY + ty;

      if (curY >= 0 && curY < maxTile) {
        tiles.push({
          key: `${basemapProvider}-${tileZoom}-${curX}-${curY}`,
          x: curX,
          y: curY,
          px: Math.round(width / 2 + (startTileX + tx - centerTileX) * scaledTileSize),
          py: Math.round(height / 2 + (curY - centerTileY) * scaledTileSize),
          size: scaledTileSize,
          url: getTileUrl(basemapProvider, curX, curY, tileZoom),
        });
      }
    }
  }
  return tiles;
}
