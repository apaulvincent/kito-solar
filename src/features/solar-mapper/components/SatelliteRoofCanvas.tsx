// src/features/solar-mapper/components/SatelliteRoofCanvas.tsx
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PenTool,
  RotateCcw,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Sparkles,
  AlertTriangle,
  Move,
  Layers,
  Box,
  CheckCircle2,
  Scan,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { GeoPoint } from '../types/solarMapper';
import { calculateHaversineDistanceMeters } from '../utils/geodesicMath';
import { detectRoofFromMarquee } from '../services/aiRoofDetectionService';

const TILE_SIZE = 256;
const MAX_NATIVE_ZOOM = 19; // Esri native satellite resolution limit

// Mercator Projection Math
function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function tileXToLng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export const SatelliteRoofCanvas: React.FC = () => {
  const {
    coordinates,
    setCoordinates,
    zoom,
    setZoom,
    roofSections,
    activeSectionId,
    setActiveSectionId,
    isDrawingMode,
    setIsDrawingMode,
    addVertexToActiveSection,
    updateVertexPosition,
    undoLastVertex,
    clearActivePolygon,
    addRoofSection,
    loadDemoRoofPolygon,
    applyDetectedRoofFaces,
    setViewMode,
  } = useSolarMapperStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedVertex, setDraggedVertex] = useState<{
    sectionId: string;
    index: number;
  } | null>(null);

  // AI Marquee Roof Scanner State
  const [isMarqueeMode, setIsMarqueeMode] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanStep, setAiScanStep] = useState('Scanning Satellite Spectral Imagery...');
  const [aiScanBox, setAiScanBox] = useState<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    widthM: number;
    lengthM: number;
    areaSqm: number;
  } | null>(null);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Resize observer to keep viewport responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.max(300, Math.round(entry.contentRect.width)),
          height: Math.max(300, Math.round(entry.contentRect.height)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Native tile fetch zoom (capped at 19 so Esri never returns placeholder tiles)
  const tileZoom = Math.min(zoom, MAX_NATIVE_ZOOM);
  const zoomScale = Math.pow(2, zoom - tileZoom);
  const scaledTileSize = TILE_SIZE * zoomScale;

  // Center coordinate in Web Mercator tile units at tileZoom
  const centerTileX = useMemo(
    () => lngToTileX(coordinates.lng, tileZoom) + panOffset.x / scaledTileSize,
    [coordinates.lng, tileZoom, panOffset.x, scaledTileSize]
  );
  const centerTileY = useMemo(
    () => latToTileY(coordinates.lat, tileZoom) + panOffset.y / scaledTileSize,
    [coordinates.lat, tileZoom, panOffset.y, scaledTileSize]
  );

  // Convert (lat, lng) to canvas (px, py)
  const geoToPixel = useCallback(
    (pt: GeoPoint) => {
      const tileX = lngToTileX(pt.lng, tileZoom);
      const tileY = latToTileY(pt.lat, tileZoom);
      const px = dimensions.width / 2 + (tileX - centerTileX) * scaledTileSize;
      const py = dimensions.height / 2 + (tileY - centerTileY) * scaledTileSize;
      return { px, py };
    },
    [tileZoom, centerTileX, centerTileY, dimensions.width, dimensions.height, scaledTileSize]
  );

  // Convert canvas (px, py) to (lat, lng)
  const pixelToGeo = useCallback(
    (px: number, py: number): GeoPoint => {
      const tileX = centerTileX + (px - dimensions.width / 2) / scaledTileSize;
      const tileY = centerTileY + (py - dimensions.height / 2) / scaledTileSize;
      return {
        lat: tileYToLat(tileY, tileZoom),
        lng: tileXToLng(tileX, tileZoom),
      };
    },
    [centerTileX, centerTileY, dimensions.width, dimensions.height, tileZoom, scaledTileSize]
  );

  // Compute visible tile indices for Slippy map at tileZoom
  const visibleTiles = useMemo(() => {
    const tilesAcross = Math.ceil(dimensions.width / scaledTileSize) + 2;
    const tilesDown = Math.ceil(dimensions.height / scaledTileSize) + 2;

    const startTileX = Math.floor(centerTileX - tilesAcross / 2);
    const startTileY = Math.floor(centerTileY - tilesDown / 2);

    const tiles: { key: string; x: number; y: number; px: number; py: number; size: number; url: string }[] = [];
    const maxTile = Math.pow(2, tileZoom);

    for (let ty = 0; ty <= tilesDown; ty++) {
      for (let tx = 0; tx <= tilesAcross; tx++) {
        const curX = ((startTileX + tx) % maxTile + maxTile) % maxTile;
        const curY = startTileY + ty;

        if (curY >= 0 && curY < maxTile) {
          const px = dimensions.width / 2 + (startTileX + tx - centerTileX) * scaledTileSize;
          const py = dimensions.height / 2 + (curY - centerTileY) * scaledTileSize;

          // Esri World Imagery (High-Res Global Satellite Basemap)
          const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tileZoom}/${curY}/${curX}`;

          tiles.push({
            key: `${tileZoom}-${curX}-${curY}`,
            x: curX,
            y: curY,
            px,
            py,
            size: scaledTileSize,
            url,
          });
        }
      }
    }
    return tiles;
  }, [centerTileX, centerTileY, dimensions.width, dimensions.height, tileZoom, scaledTileSize]);

  // Dynamic marquee bounding box computation
  const currentMarqueeBounds = useMemo(() => {
    if (!marqueeStart || !marqueeCurrent) return null;
    const minX = Math.min(marqueeStart.x, marqueeCurrent.x);
    const maxX = Math.max(marqueeStart.x, marqueeCurrent.x);
    const minY = Math.min(marqueeStart.y, marqueeCurrent.y);
    const maxY = Math.max(marqueeStart.y, marqueeCurrent.y);
    const widthPx = maxX - minX;
    const heightPx = maxY - minY;

    const nw = pixelToGeo(minX, minY);
    const se = pixelToGeo(maxX, maxY);
    const widthM = calculateHaversineDistanceMeters(nw, { lat: nw.lat, lng: se.lng });
    const lengthM = calculateHaversineDistanceMeters(nw, { lat: se.lat, lng: nw.lng });
    const areaSqm = Math.round(widthM * lengthM);

    return { minX, maxX, minY, maxY, widthPx, heightPx, widthM, lengthM, areaSqm };
  }, [marqueeStart, marqueeCurrent, pixelToGeo]);

  // Execute AI roof detection workflow
  const executeAiRoofDetection = async (
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) => {
    let minX = Math.min(p1.x, p2.x);
    let maxX = Math.max(p1.x, p2.x);
    let minY = Math.min(p1.y, p2.y);
    let maxY = Math.max(p1.y, p2.y);

    // If click or small marquee, default to a 130px x 90px bounding box centered at click
    if (maxX - minX < 15 || maxY - minY < 15) {
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;
      minX = midX - 65;
      maxX = midX + 65;
      minY = midY - 45;
      maxY = midY + 45;
    }

    const nw = pixelToGeo(minX, minY);
    const se = pixelToGeo(maxX, maxY);

    // Physical dimensions
    const widthM = calculateHaversineDistanceMeters(nw, { lat: nw.lat, lng: se.lng });
    const lengthM = calculateHaversineDistanceMeters(nw, { lat: se.lat, lng: nw.lng });
    const areaSqm = Math.round(widthM * lengthM);

    setIsAiScanning(true);
    setAiScanBox({ minX, maxX, minY, maxY, widthM, lengthM, areaSqm });
    setAiScanStep('Scanning Satellite Spectral Imagery...');

    // Offscreen canvas image capture
    let imageCropBase64: string | undefined = undefined;
    try {
      const offscreen = document.createElement('canvas');
      const boxW = Math.max(64, Math.round(maxX - minX));
      const boxH = Math.max(64, Math.round(maxY - minY));
      offscreen.width = Math.min(512, boxW);
      offscreen.height = Math.min(512, boxH);
      const ctx = offscreen.getContext('2d');
      if (ctx && containerRef.current) {
        const tileImgs = containerRef.current.querySelectorAll<HTMLImageElement>('img');
        const rect = containerRef.current.getBoundingClientRect();
        tileImgs.forEach((img) => {
          const imgRect = img.getBoundingClientRect();
          const sx = imgRect.left - rect.left;
          const sy = imgRect.top - rect.top;
          ctx.drawImage(img, sx - minX, sy - minY, img.width, img.height);
        });
        imageCropBase64 = offscreen.toDataURL('image/jpeg', 0.85);
      }
    } catch {
      // Graceful fallback
    }

    const timer1 = setTimeout(() => {
      setAiScanStep('Segmenting Roof Planes, Valleys & Ridges...');
    }, 450);

    const timer2 = setTimeout(() => {
      setAiScanStep('Calculating Azimuth Heading & Tilt Vectors...');
    }, 900);

    try {
      const result = await detectRoofFromMarquee({
        bounds: { northWest: nw, southEast: se },
        dimensions: { widthM, lengthM, areaSqm },
        imageCropBase64,
      });

      applyDetectedRoofFaces(result.faces);

      setScanToast(
        `AI Mapped ${result.faces.length} Roof Faces (${result.faces[0]?.pitchDeg || 18}° pitch • ${
          result.faces[0]?.azimuthDeg || 180
        }° azimuth)`
      );
      setTimeout(() => setScanToast(null), 4500);
    } catch (err) {
      console.error('[AI Roof Detection Error]:', err);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAiScanning(false);
      setAiScanBox(null);
      setIsMarqueeMode(false);
    }
  };

  // Pointer event handlers for drawing, dragging vertices, marquee scanning, and panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.map-control-btn')) return;

    if (e.button === 0) {
      if (isMarqueeMode) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        setMarqueeStart({ x: px, y: py });
        setMarqueeCurrent({ x: px, y: py });
        return;
      }

      if (!isDrawingMode && !draggedVertex) {
        setIsPanning(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMarqueeMode && marqueeStart) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setMarqueeCurrent({ x: px, y: py });
      return;
    }

    if (draggedVertex) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const geo = pixelToGeo(px, py);
      updateVertexPosition(draggedVertex.sectionId, draggedVertex.index, geo);
      return;
    }

    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanOffset((prev) => ({ x: prev.x - dx, y: prev.y - dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = () => {
    if (isMarqueeMode && marqueeStart && marqueeCurrent) {
      const p1 = marqueeStart;
      const p2 = marqueeCurrent;
      setMarqueeStart(null);
      setMarqueeCurrent(null);
      executeAiRoofDetection(p1, p2);
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      // Persist new center when panning concludes
      const newCenter = pixelToGeo(dimensions.width / 2, dimensions.height / 2);
      setCoordinates(newCenter);
      setPanOffset({ x: 0, y: 0 });
    }
    if (draggedVertex) {
      setDraggedVertex(null);
    }
  };

  // Canvas Click: add vertex when in Draw Mode
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMarqueeMode || !isDrawingMode || draggedVertex) return;
    if ((e.target as HTMLElement).closest('.vertex-handle') || (e.target as HTMLElement).closest('.map-control-btn')) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const geo = pixelToGeo(px, py);

    addVertexToActiveSection(geo);
  };

  const activeSection = roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-slate-950 shadow-lg select-none">
      {/* Viewport Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleCanvasClick}
        className={`relative w-full h-[480px] sm:h-[560px] lg:h-[620px] overflow-hidden ${
          isDrawingMode || isMarqueeMode
            ? 'cursor-crosshair'
            : isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
      >
        {/* Layer 1: Satellite Tiles */}
        <div className="absolute inset-0 pointer-events-none">
          {visibleTiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.url}
              alt=""
              loading="lazy"
              crossOrigin="anonymous"
              className="absolute object-cover filter contrast-[1.05] brightness-[0.95]"
              style={{
                width: `${tile.size}px`,
                height: `${tile.size}px`,
                transform: `translate3d(${tile.px}px, ${tile.py}px, 0)`,
              }}
            />
          ))}
        </div>

        {/* Layer 2: Subtle Center Crosshair */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 z-10">
          <Crosshair className="w-6 h-6 text-amber-400 stroke-1" />
        </div>

        {/* Layer 3: Interactive SVG Overlay for Polygons, Panels & Measurement Badges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            {/* Solar Panel Module Pattern / Texture */}
            <pattern id="solar-panel-grid" width="4" height="6" patternUnits="userSpaceOnUse">
              <rect width="4" height="6" fill="#1e293b" />
              <line x1="0" y1="0" x2="4" y2="0" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Render All Roof Sections */}
          {roofSections.map((sec) => {
            const isActive = sec.id === activeSection?.id;
            const pts = sec.vertices.map(geoToPixel);
            if (pts.length === 0) return null;

            const pathD =
              pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`, '') +
              (pts.length > 2 ? ' Z' : '');

            const isBowtie = sec.hasBowtieCross;
            const strokeColor = isBowtie
              ? '#f43f5e'
              : isActive
              ? '#f59e0b'
              : '#94a3b8';
            const fillColor = isBowtie
              ? 'rgba(244, 63, 94, 0.25)'
              : isActive
              ? 'rgba(245, 158, 11, 0.22)'
              : 'rgba(148, 163, 184, 0.15)';

            return (
              <g key={sec.id}>
                {/* Polygon Area Fill & Stroke */}
                <path
                  d={pathD}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={pts.length < 3 ? '4 4' : undefined}
                  className="transition-colors duration-200"
                />

                {/* Render Placed Solar Panels Inside Closed Polygon */}
                {pts.length >= 3 &&
                  sec.placedPanels.map((panel) => {
                    // Approximate meter-to-pixel scale at current zoom & latitude
                    const meterToPx =
                      (Math.pow(2, zoom) * 256) /
                      (40075016 * Math.cos((coordinates.lat * Math.PI) / 180));

                    // Centroid pixel
                    const centroidPx = {
                      x: pts.reduce((s, p) => s + p.px, 0) / pts.length,
                      y: pts.reduce((s, p) => s + p.py, 0) / pts.length,
                    };

                    const panelPxX = centroidPx.x + panel.x * meterToPx;
                    const panelPxY = centroidPx.y - panel.y * meterToPx;
                    const panelPxW = Math.max(3, panel.widthM * meterToPx);
                    const panelPxH = Math.max(4, panel.lengthM * meterToPx);

                    return (
                      <rect
                        key={panel.id}
                        x={panelPxX - panelPxW / 2}
                        y={panelPxY - panelPxH / 2}
                        width={panelPxW}
                        height={panelPxH}
                        transform={
                          panel.rotationDeg
                            ? `rotate(${-panel.rotationDeg}, ${panelPxX}, ${panelPxY})`
                            : undefined
                        }
                        fill="#0c4a6e"
                        stroke="#38bdf8"
                        strokeWidth="0.8"
                        rx="1"
                        opacity={0.88}
                      />
                    );
                  })}

                {/* Edge Length Measurement Badges */}
                {pts.length >= 2 &&
                  pts.map((p1, i) => {
                    const nextIdx = (i + 1) % pts.length;
                    if (pts.length < 3 && nextIdx === 0) return null;
                    const p2 = pts[nextIdx];

                    const midX = (p1.px + p2.px) / 2;
                    const midY = (p1.py + p2.py) / 2;
                    const lengthM = calculateHaversineDistanceMeters(
                      sec.vertices[i],
                      sec.vertices[nextIdx]
                    );

                    return (
                      <g key={`edge-${sec.id}-${i}`}>
                        <rect
                          x={midX - 22}
                          y={midY - 10}
                          width="44"
                          height="20"
                          rx="6"
                          fill="#0f172a"
                          stroke={isActive ? '#f59e0b' : '#475569'}
                          strokeWidth="1"
                          opacity={0.92}
                        />
                        <text
                          x={midX}
                          y={midY + 4}
                          fill="#f8fafc"
                          fontSize="10"
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {lengthM.toFixed(1)}m
                        </text>
                      </g>
                    );
                  })}

                {/* Draggable Vertex Corner Handles */}
                {isActive &&
                  pts.map((p, i) => (
                    <circle
                      key={`vertex-${sec.id}-${i}`}
                      cx={p.px}
                      cy={p.py}
                      r="6.5"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-move pointer-events-auto vertex-handle transition-transform hover:scale-125"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setDraggedVertex({ sectionId: sec.id, index: i });
                      }}
                    />
                  ))}
              </g>
            );
          })}

          {/* Active Marquee Bounding Box during dragging */}
          {currentMarqueeBounds && currentMarqueeBounds.widthPx > 4 && currentMarqueeBounds.heightPx > 4 && (
            <g>
              {/* Marquee Area Tint & Pulsing Dashed Border */}
              <rect
                x={currentMarqueeBounds.minX}
                y={currentMarqueeBounds.minY}
                width={currentMarqueeBounds.widthPx}
                height={currentMarqueeBounds.heightPx}
                fill="rgba(245, 158, 11, 0.14)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
              {/* Corner Calipers (Top-Left, Top-Right, Bottom-Left, Bottom-Right) */}
              <path
                d={`M ${currentMarqueeBounds.minX} ${currentMarqueeBounds.minY + 14} L ${currentMarqueeBounds.minX} ${currentMarqueeBounds.minY} L ${currentMarqueeBounds.minX + 14} ${currentMarqueeBounds.minY}`}
                stroke="#fbbf24"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d={`M ${currentMarqueeBounds.maxX - 14} ${currentMarqueeBounds.minY} L ${currentMarqueeBounds.maxX} ${currentMarqueeBounds.minY} L ${currentMarqueeBounds.maxX} ${currentMarqueeBounds.minY + 14}`}
                stroke="#fbbf24"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d={`M ${currentMarqueeBounds.minX} ${currentMarqueeBounds.maxY - 14} L ${currentMarqueeBounds.minX} ${currentMarqueeBounds.maxY} L ${currentMarqueeBounds.minX + 14} ${currentMarqueeBounds.maxY}`}
                stroke="#fbbf24"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d={`M ${currentMarqueeBounds.maxX - 14} ${currentMarqueeBounds.maxY} L ${currentMarqueeBounds.maxX} ${currentMarqueeBounds.maxY} L ${currentMarqueeBounds.maxX} ${currentMarqueeBounds.maxY - 14}`}
                stroke="#fbbf24"
                strokeWidth="2.5"
                fill="none"
              />
            </g>
          )}
        </svg>

        {/* Live Marquee Dimension Chip while dragging */}
        {currentMarqueeBounds && currentMarqueeBounds.widthPx > 10 && (
          <div
            className="absolute pointer-events-none z-30 transition-all"
            style={{
              left: `${currentMarqueeBounds.minX}px`,
              top: `${Math.max(12, currentMarqueeBounds.minY - 32)}px`,
            }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold shadow-xl backdrop-blur-md whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                {currentMarqueeBounds.widthM.toFixed(1)}m × {currentMarqueeBounds.lengthM.toFixed(1)}m • {currentMarqueeBounds.areaSqm} m²
              </span>
            </div>
          </div>
        )}

        {/* AI Laser Scanning Radar HUD Overlay */}
        {isAiScanning && aiScanBox && (
          <div
            className="absolute pointer-events-none z-30 overflow-hidden border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4)] rounded-xl bg-amber-500/10 backdrop-blur-[1px]"
            style={{
              left: `${aiScanBox.minX}px`,
              top: `${aiScanBox.minY}px`,
              width: `${aiScanBox.maxX - aiScanBox.minX}px`,
              height: `${aiScanBox.maxY - aiScanBox.minY}px`,
            }}
          >
            {/* Animated Laser Beam */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_15px_#f59e0b] animate-laser-sweep" />

            {/* Radar Center HUD Card */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <div className="p-1 rounded-2xl bg-white/10 backdrop-blur-2xl shadow-2xl max-w-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/95 border border-amber-500/30 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider">AI Photogrammetry</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    {aiScanStep}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {aiScanBox.widthM.toFixed(1)}m × {aiScanBox.lengthM.toFixed(1)}m • {aiScanBox.areaSqm} m²
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top-Center: Marquee Guidance Banner */}
        {isMarqueeMode && !isAiScanning && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-950/90 border border-amber-500/50 text-slate-200 text-xs font-semibold backdrop-blur-xl shadow-2xl flex items-center gap-2 z-30 animate-pulse">
            <Scan className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="whitespace-nowrap">Drag a box over any roof to map faces, pitch & orientation with AI</span>
          </div>
        )}

        {/* Top-Center: AI Scan Success Toast */}
        {scanToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-semibold backdrop-blur-xl shadow-2xl flex items-center gap-2 z-30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="whitespace-nowrap">{scanToast}</span>
          </div>
        )}

        {/* Self-Intersection Warning Banner */}
        {activeSection?.hasBowtieCross && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-semibold backdrop-blur-md shadow-lg flex items-center gap-2 z-30">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Polygon edges are crossing (bowtie shape). Please uncross the corners.</span>
          </div>
        )}

        {/* Top-Left: Precision Satellite Compass Rose */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 select-none group">
          <div
            className="w-11 h-11 rounded-full bg-slate-950/85 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105"
            title="Map Orientation: True North (0°)"
          >
            <svg viewBox="0 0 44 44" className="w-full h-full">
              {/* Outer subtle dial ring */}
              <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <circle cx="22" cy="22" r="16.5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.75" />

              {/* Cardinal tick marks */}
              <line x1="22" y1="2" x2="22" y2="5.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="42" y1="22" x2="38.5" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
              <line x1="22" y1="42" x2="22" y2="38.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
              <line x1="2" y1="22" x2="5.5" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />

              {/* Cardinal Labels */}
              <text x="22" y="10" textAnchor="middle" fill="#f59e0b" fontSize="5.5" fontWeight="bold" fontFamily="system-ui, sans-serif">N</text>
              <text x="35.5" y="23.5" textAnchor="middle" fill="#64748b" fontSize="4" fontWeight="600" fontFamily="system-ui, sans-serif">E</text>
              <text x="22" y="37" textAnchor="middle" fill="#64748b" fontSize="4" fontWeight="600" fontFamily="system-ui, sans-serif">S</text>
              <text x="8.5" y="23.5" textAnchor="middle" fill="#64748b" fontSize="4" fontWeight="600" fontFamily="system-ui, sans-serif">W</text>

              {/* Compass Needle */}
              {/* North Arrow (Amber / Gold) */}
              <polygon points="22,11 24.5,21.5 22,20" fill="#f59e0b" />
              <polygon points="22,11 19.5,21.5 22,20" fill="#d97706" />

              {/* South Arrow (Slate) */}
              <polygon points="22,33 24.5,22.5 22,24" fill="#475569" />
              <polygon points="22,33 19.5,22.5 22,24" fill="#334155" />

              {/* Center Pivot Hub */}
              <circle cx="22" cy="22" r="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
            </svg>
          </div>

          {/* Orientation Readout Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-[11px] font-mono text-slate-300 backdrop-blur-md shadow-md opacity-90 transition-opacity">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="font-bold text-amber-400">North 0°</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">True North</span>
          </div>
        </div>

        {/* Top-Right: Map Mode & View Mode Switcher */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
          <button
            type="button"
            onClick={() => setViewMode('3d_preview')}
            className="map-control-btn px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/40 text-xs font-bold backdrop-blur-md shadow-md transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap flex-shrink-0"
            title="Inspect 3D pitched roof & sun movement"
          >
            <Box className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="whitespace-nowrap">3D Roof & Sun View</span>
          </button>
        </div>

        {/* Floating Drawing & Zoom Studio Dock (Unified, No-Overlap Island) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/90 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl z-30 select-none">
          {/* AI Marquee Auto-Map Button */}
          <button
            type="button"
            onClick={() => {
              if (isDrawingMode) setIsDrawingMode(false);
              setIsMarqueeMode(!isMarqueeMode);
            }}
            className={`map-control-btn px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
              isMarqueeMode
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-amber-300 hover:text-white hover:bg-white/10'
            }`}
            title="Marquee Drag over any building roof to auto-detect faces, tilt & azimuth with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-current flex-shrink-0 animate-pulse" />
            <span className="whitespace-nowrap">{isMarqueeMode ? 'Cancel Marquee' : 'AI Auto-Map'}</span>
          </button>

          {/* Manual Drawing Mode */}
          <button
            type="button"
            onClick={() => {
              if (isMarqueeMode) setIsMarqueeMode(false);
              setIsDrawingMode(!isDrawingMode);
            }}
            className={`map-control-btn px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
              isDrawingMode
                ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 transition-transform ${
                isDrawingMode ? 'bg-slate-950 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <PenTool className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{isDrawingMode ? 'Finish Polygon' : 'Draw Roof'}</span>
          </button>

          <button
            type="button"
            onClick={loadDemoRoofPolygon}
            className="map-control-btn px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
            title="Load sample residential 4-corner roof"
          >
            <span className="whitespace-nowrap">Sample Roof</span>
          </button>

          <div className="w-px h-4 bg-white/10 my-auto flex-shrink-0" />

          <button
            type="button"
            onClick={undoLastVertex}
            disabled={!activeSection || activeSection.vertices.length === 0}
            className="map-control-btn p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex-shrink-0"
            title="Undo last point"
          >
            <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
          </button>

          <button
            type="button"
            onClick={clearActivePolygon}
            disabled={!activeSection || activeSection.vertices.length === 0}
            className="map-control-btn p-1.5 rounded-full text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex-shrink-0"
            title="Clear active roof polygon"
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => addRoofSection()}
            className="map-control-btn px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0"
            title="Add second roof section (e.g. Garage)"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="whitespace-nowrap">Add Face</span>
          </button>

          <div className="w-px h-4 bg-white/10 my-auto flex-shrink-0" />

          {/* Integrated Tactile Zoom Segment with Live Readout */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-full p-0.5 border border-white/5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setZoom(zoom - 1)}
              disabled={zoom <= 16}
              className="map-control-btn p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex-shrink-0"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-2 select-none whitespace-nowrap flex-shrink-0">
              Z{zoom}
              {zoom > MAX_NATIVE_ZOOM && (
                <span className="text-amber-400 font-semibold ml-1 whitespace-nowrap">
                  ({zoomScale}x)
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setZoom(zoom + 1)}
              disabled={zoom >= 21}
              className="map-control-btn p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex-shrink-0"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Discrete Satellite Attribution Stamp at bottom-left */}
        <div className="absolute bottom-3 left-4 hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400/80 pointer-events-none select-none z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Esri World Imagery • High-Res</span>
        </div>
      </div>
    </div>
  );
};
