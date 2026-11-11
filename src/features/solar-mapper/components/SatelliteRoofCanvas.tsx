import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Crosshair,
  PenTool,
  Plus,
  RotateCcw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { GeoPoint } from '../types/solarMapper';
import {
  TILE_SIZE,
  computeVisibleTiles,
  getMaxNativeZoom,
  latToTileY,
  lngToTileX,
  tileXToLng,
  tileYToLat,
} from '../utils/mercator';
import { SatelliteCompassRose } from './SatelliteCompassRose';
import { SatelliteBasemapMenu } from './SatelliteBasemapMenu';

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
    removeRoofSection,
    setViewMode,
    basemapProvider,
    setBasemapProvider,
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
  const [movingVertex, setMovingVertex] = useState<{
    sectionId: string;
    index: number;
  } | null>(null);
  const wasDraggingRef = useRef(false);
  const dragStartCoordRef = useRef<{ x: number; y: number } | null>(null);
  const dragHasMovedRef = useRef(false);
  const dragResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleDragFlagReset = useCallback(() => {
    if (dragResetTimerRef.current !== null) {
      clearTimeout(dragResetTimerRef.current);
    }
    dragResetTimerRef.current = setTimeout(() => {
      dragResetTimerRef.current = null;
      wasDraggingRef.current = false;
    }, 120);
  }, []);

  useEffect(() => {
    return () => {
      if (dragResetTimerRef.current !== null) {
        clearTimeout(dragResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (movingVertex) setMovingVertex(null);
        if (draggedVertex) setDraggedVertex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movingVertex, draggedVertex]);

  useEffect(() => {
    if (!containerRef.current) return;
    let rafId: number | null = null;
    const observer = new ResizeObserver((entries) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          const w = Math.max(300, Math.round(entry.contentRect.width));
          const h = Math.max(300, Math.round(entry.contentRect.height));
          setDimensions((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
        }
      });
    });
    observer.observe(containerRef.current);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  const maxNativeZoom = getMaxNativeZoom(basemapProvider);
  const tileZoom = Math.min(zoom, maxNativeZoom);
  const zoomScale = Math.pow(2, zoom - tileZoom);
  const scaledTileSize = TILE_SIZE * zoomScale;

  const centerTileX = useMemo(
    () => lngToTileX(coordinates.lng, tileZoom) + panOffset.x / scaledTileSize,
    [coordinates.lng, tileZoom, panOffset.x, scaledTileSize]
  );
  const centerTileY = useMemo(
    () => latToTileY(coordinates.lat, tileZoom) + panOffset.y / scaledTileSize,
    [coordinates.lat, tileZoom, panOffset.y, scaledTileSize]
  );

  const geoToPixel = useCallback(
    (pt: GeoPoint) => {
      const tileX = lngToTileX(pt.lng, tileZoom);
      const tileY = latToTileY(pt.lat, tileZoom);
      return {
        px: dimensions.width / 2 + (tileX - centerTileX) * scaledTileSize,
        py: dimensions.height / 2 + (tileY - centerTileY) * scaledTileSize,
      };
    },
    [tileZoom, centerTileX, centerTileY, dimensions.width, dimensions.height, scaledTileSize]
  );

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

  useEffect(() => {
    if (!draggedVertex) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (dragStartCoordRef.current) {
        const dx = e.clientX - dragStartCoordRef.current.x;
        const dy = e.clientY - dragStartCoordRef.current.y;
        if (Math.hypot(dx, dy) > 2) {
          dragHasMovedRef.current = true;
          wasDraggingRef.current = true;
        }
      }

      updateVertexPosition(draggedVertex.sectionId, draggedVertex.index, pixelToGeo(px, py));
    };

    const handleWindowPointerUp = () => {
      if (isDrawingMode && draggedVertex.index === 0 && !dragHasMovedRef.current) {
        const sec = roofSections.find((s) => s.id === draggedVertex.sectionId);
        if (sec && sec.vertices.length >= 3) {
          setIsDrawingMode(false);
        }
      }

      setDraggedVertex(null);
      if (dragHasMovedRef.current) {
        wasDraggingRef.current = true;
        scheduleDragFlagReset();
      } else if (!isDrawingMode) {
        setMovingVertex((prev) => {
          if (
            prev &&
            prev.sectionId === draggedVertex.sectionId &&
            prev.index === draggedVertex.index
          ) {
            return null;
          }
          return { sectionId: draggedVertex.sectionId, index: draggedVertex.index };
        });
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [
    draggedVertex,
    isDrawingMode,
    pixelToGeo,
    updateVertexPosition,
    roofSections,
    setIsDrawingMode,
    scheduleDragFlagReset,
  ]);

  const visibleTiles = useMemo(
    () =>
      computeVisibleTiles({
        basemapProvider,
        tileZoom,
        scaledTileSize,
        centerTileX,
        centerTileY,
        width: dimensions.width,
        height: dimensions.height,
      }),
    [basemapProvider, tileZoom, scaledTileSize, centerTileX, centerTileY, dimensions.width, dimensions.height]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('.map-control-btn') ||
      (e.target as HTMLElement).closest('.vertex-handle')
    ) {
      return;
    }

    if (e.button === 0) {
      if (movingVertex) {
        setMovingVertex(null);
        return;
      }

      if (!isDrawingMode && !draggedVertex) {
        setIsPanning(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (movingVertex) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const geo = pixelToGeo(e.clientX - rect.left, e.clientY - rect.top);
      updateVertexPosition(movingVertex.sectionId, movingVertex.index, geo);
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
    if (isPanning) {
      setIsPanning(false);
      const newCenter = pixelToGeo(dimensions.width / 2, dimensions.height / 2);
      setCoordinates(newCenter);
      setPanOffset({ x: 0, y: 0 });
    }

    if (draggedVertex) {
      setDraggedVertex(null);
      if (dragHasMovedRef.current) {
        wasDraggingRef.current = true;
        scheduleDragFlagReset();
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      if (dragResetTimerRef.current !== null) {
        clearTimeout(dragResetTimerRef.current);
        dragResetTimerRef.current = null;
      }
      return;
    }

    if (movingVertex) {
      setMovingVertex(null);
      return;
    }

    if (draggedVertex) return;
    if (
      (e.target as HTMLElement).closest('.vertex-handle') ||
      (e.target as HTMLElement).closest('.map-control-btn')
    ) {
      return;
    }

    if (isDrawingMode) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      addVertexToActiveSection(pixelToGeo(e.clientX - rect.left, e.clientY - rect.top));
    } else if (!(e.target as HTMLElement).closest('path')) {
      setActiveSectionId(null);
    }
  };

  const activeSection = activeSectionId
    ? roofSections.find((s) => s.id === activeSectionId) || null
    : null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-slate-950 shadow-lg select-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleCanvasClick}
        className={`relative w-full h-[480px] sm:h-[560px] lg:h-[620px] overflow-hidden ${
          isDrawingMode ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          {visibleTiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.url}
              alt=""
              decoding="async"
              crossOrigin="anonymous"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0';
              }}
              className="absolute top-0 left-0 object-cover filter contrast-[1.05] brightness-[0.95]"
              style={{
                width: `${Math.ceil(tile.size) + 1}px`,
                height: `${Math.ceil(tile.size) + 1}px`,
                transform: `translate3d(${tile.px}px, ${tile.py}px, 0)`,
                imageRendering: zoom > maxNativeZoom ? 'crisp-edges' : 'auto',
              }}
            />
          ))}
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 z-10">
          <Crosshair className="w-6 h-6 text-amber-400 stroke-1" />
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            <pattern id="solar-panel-grid" width="4" height="6" patternUnits="userSpaceOnUse">
              <rect width="4" height="6" fill="#1e293b" />
              <line x1="0" y1="0" x2="4" y2="0" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {roofSections.map((sec) => {
            const isActive = sec.id === activeSection?.id;
            const pts = sec.vertices.map(geoToPixel);
            if (pts.length === 0) return null;

            const pathD =
              pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`, '') +
              (pts.length > 2 ? ' Z' : '');

            const isBowtie = sec.hasBowtieCross;
            const strokeColor = isBowtie ? '#f43f5e' : isActive ? '#f59e0b' : '#94a3b8';
            const fillColor = isBowtie
              ? 'rgba(244, 63, 94, 0.25)'
              : isActive
              ? 'rgba(245, 158, 11, 0.22)'
              : 'rgba(148, 163, 184, 0.15)';

            return (
              <g key={sec.id}>
                <path
                  d={pathD}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={pts.length < 3 ? '4 4' : undefined}
                  onPointerDown={(e) => {
                    if (isDrawingMode) return;
                    e.stopPropagation();
                    setActiveSectionId(sec.id);
                  }}
                  className={`transition-colors duration-200 ${
                    isDrawingMode
                      ? 'pointer-events-none'
                      : 'pointer-events-auto cursor-pointer hover:stroke-amber-400'
                  }`}
                />

                {pts.length >= 3 &&
                  sec.placedPanels.length > 0 &&
                  (() => {
                    const meterToPx =
                      (Math.pow(2, zoom) * 256) /
                      (40075016 * Math.cos((coordinates.lat * Math.PI) / 180));
                    const centroidPx = {
                      x: pts.reduce((s, p) => s + p.px, 0) / pts.length,
                      y: pts.reduce((s, p) => s + p.py, 0) / pts.length,
                    };

                    return sec.placedPanels.map((panel) => {
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
                    });
                  })()}

                {pts.length >= 2 &&
                  pts.map((p1, i) => {
                    const nextIdx = (i + 1) % pts.length;
                    if (pts.length < 3 && nextIdx === 0) return null;
                    const p2 = pts[nextIdx];
                    const midX = (p1.px + p2.px) / 2;
                    const midY = (p1.py + p2.py) / 2;
                    const lengthM = sec.edgeLengthsMeters[i] ?? 0;

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

                {isActive &&
                  pts.map((p, i) => {
                    const isMoving = movingVertex?.sectionId === sec.id && movingVertex?.index === i;
                    const isDragging =
                      draggedVertex?.sectionId === sec.id && draggedVertex?.index === i;
                    const isSelected = isMoving || isDragging;

                    return (
                      <g
                        key={`vertex-${sec.id}-${i}`}
                        className="pointer-events-auto vertex-handle group cursor-move"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          dragStartCoordRef.current = { x: e.clientX, y: e.clientY };
                          dragHasMovedRef.current = false;
                          setActiveSectionId(sec.id);
                          setDraggedVertex({ sectionId: sec.id, index: i });
                        }}
                      >
                        {isDrawingMode && i === 0 && pts.length >= 3 && (
                          <title>Click first corner to close polygon</title>
                        )}
                        <circle cx={p.px} cy={p.py} r="14" fill="transparent" />
                        {isSelected && (
                          <circle
                            cx={p.px}
                            cy={p.py}
                            r="11"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.5"
                            opacity="0.85"
                            strokeDasharray="3 2"
                          />
                        )}
                        {!isSelected && (
                          <circle
                            cx={p.px}
                            cy={p.py}
                            r="10"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1.5"
                            className="opacity-0 group-hover:opacity-60 transition-opacity"
                          />
                        )}
                        <circle
                          cx={p.px}
                          cy={p.py}
                          r={isSelected ? 7.5 : 6.5}
                          fill={isSelected ? '#fbbf24' : '#f59e0b'}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
                        />
                      </g>
                    );
                  })}
              </g>
            );
          })}
        </svg>

        {movingVertex && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-xl backdrop-blur-xl flex items-center gap-2 z-30 animate-in fade-in zoom-in-95 duration-150">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
            <span className="whitespace-nowrap">
              Moving corner dot · Click anywhere to place (or Esc to cancel)
            </span>
          </div>
        )}

        {activeSection?.hasBowtieCross && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-semibold backdrop-blur-md shadow-lg flex items-center gap-2 z-30">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Polygon edges are crossing (bowtie shape). Please uncross the corners.</span>
          </div>
        )}

        <SatelliteCompassRose />

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

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/90 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl z-30 select-none">
          <button
            type="button"
            onClick={() => {
              const nextDrawing = !isDrawingMode;
              setIsDrawingMode(nextDrawing);
              if (nextDrawing) {
                const active = roofSections.find((s) => s.id === activeSectionId);
                if (!active || active.vertices.length >= 3) {
                  const emptySec = roofSections.find((s) => s.vertices.length === 0);
                  if (emptySec) {
                    setActiveSectionId(emptySec.id);
                  } else {
                    addRoofSection();
                  }
                }
              } else if (activeSection && activeSection.vertices.length === 0) {
                removeRoofSection(activeSection.id);
              }
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
              {zoom > maxNativeZoom && (
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

        <SatelliteBasemapMenu
          basemapProvider={basemapProvider}
          onSelectProvider={setBasemapProvider}
        />
      </div>
    </div>
  );
};
