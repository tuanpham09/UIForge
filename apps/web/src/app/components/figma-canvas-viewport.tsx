"use client";

import {
  ChevronDown,
  Compass,
  FolderKanban,
  Frame,
  Grid3x3,
  Hand,
  Maximize2,
  Minus,
  Monitor,
  MousePointer2,
  Palette,
  Play,
  Plus,
  Ruler,
  Smartphone,
  Tablet,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  FRAME_PRESETS,
  type PrototypeWire,
  useFigmaCanvas,
} from "./figma-canvas-context";
import FigmaPrototypePlayer from "./figma-prototype-player";

interface FigmaCanvasViewportProps {
  children: React.ReactNode;
}

export default function FigmaCanvasViewport({
  children,
}: FigmaCanvasViewportProps) {
  const {
    pan,
    setPan,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetZoom,
    tool,
    setTool,
    mode,
    setMode,
    isAltPressed,
    selectedFramePreset,
    setSelectedFramePreset,
    screenPositions,
    prototypeWires,
    selectedWireId,
    setSelectedWireId,
    updateWire,
    setIsPresenting,
    showMinimap,
    setShowMinimap,
    showGrid,
    setShowGrid,
    setSelectedNodeId,
    setSelectedScreenId,
    setSelectedSectionId,
    addSection,
    addScreen,
  } = useFigmaCanvas();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [creationBox, setCreationBox] = useState<{
    active: boolean;
    tool: "frame" | "section";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({
    active: false,
    tool: "frame",
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Marquee selection box state
  const [marquee, setMarquee] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });

  // Listen to Space key for pan hand tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed) {
        if ((e.target as HTMLElement).tagName !== "INPUT") {
          e.preventDefault();
          setIsSpacePressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // Handle Wheel for Pan & Zoom (Ctrl + Wheel / Pinch)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((z) =>
        Math.min(2.5, Math.max(0.25, Math.round(z * zoomFactor * 100) / 100)),
      );
    } else {
      setPan((p) => ({
        x: Math.round(p.x - e.deltaX),
        y: Math.round(p.y - e.deltaY),
      }));
    }
  };

  // Handle Canvas Drag-Pan & Marquee Selection
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // If clicking directly on empty canvas background
    const isCanvasBg =
      target === containerRef.current ||
      target.dataset.testid === "renderer-preview" ||
      target.tagName === "svg";

    if (e.button === 1 || isSpacePressed || tool === "hand") {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };

      const onMouseMove = (moveEvt: MouseEvent) => {
        setPan({
          x: moveEvt.clientX - panStartRef.current.x,
          y: moveEvt.clientY - panStartRef.current.y,
        });
      };

      const onMouseUp = () => {
        setIsPanning(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return;
    }

    // ── Interactive Frame & Section Creation (OpenPencil & Figma Tool) ──
    if (isCanvasBg && (tool === "frame" || tool === "section")) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const startClientX = e.clientX - rect.left;
      const startClientY = e.clientY - rect.top;
      const startCanvasX = Math.round((startClientX - pan.x) / zoom);
      const startCanvasY = Math.round((startClientY - pan.y) / zoom);

      const activeCreationTool = tool;

      setCreationBox({
        active: true,
        tool: activeCreationTool,
        startX: startClientX,
        startY: startClientY,
        currentX: startClientX,
        currentY: startClientY,
      });

      const onMouseMove = (moveEvt: MouseEvent) => {
        setCreationBox((prev) => ({
          ...prev,
          currentX: moveEvt.clientX - rect.left,
          currentY: moveEvt.clientY - rect.top,
        }));
      };

      const onMouseUp = (upEvt: MouseEvent) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        setCreationBox((prev) => ({ ...prev, active: false }));

        const endClientX = upEvt.clientX - rect.left;
        const endClientY = upEvt.clientY - rect.top;
        const endCanvasX = Math.round((endClientX - pan.x) / zoom);
        const endCanvasY = Math.round((endClientY - pan.y) / zoom);

        const w = Math.abs(endCanvasX - startCanvasX);
        const h = Math.abs(endCanvasY - startCanvasY);
        const left = Math.min(startCanvasX, endCanvasX);
        const top = Math.min(startCanvasY, endCanvasY);

        if (activeCreationTool === "frame") {
          const preset = FRAME_PRESETS[selectedFramePreset];
          if (w < 20 || h < 20) {
            // Clicked without dragging: spawn preset frame
            addScreen({
              x: startCanvasX,
              y: startCanvasY,
              w: preset.w,
              h: preset.h,
              title: `${preset.label} Frame`,
              device: preset.device,
            });
          } else {
            // Dragged: spawn custom sized frame
            addScreen({
              x: left,
              y: top,
              w: Math.max(160, w),
              h: Math.max(160, h),
              title: "Custom Frame",
              device: "Custom Frame",
            });
          }
          setTool("select");
        } else if (activeCreationTool === "section") {
          if (w < 20 || h < 20) {
            // Clicked without dragging: spawn default section
            addSection({
              x: startCanvasX,
              y: startCanvasY,
              w: 800,
              h: 600,
              title: "New Workflow Section",
            });
          } else {
            // Dragged: spawn custom sized section
            addSection({
              x: left,
              y: top,
              w: Math.max(200, w),
              h: Math.max(150, h),
              title: "New Workflow Section",
            });
          }
          setTool("select");
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return;
    }

    if (isCanvasBg && tool === "select") {
      // Clear selection on empty click
      setSelectedNodeId(null);
      setSelectedScreenId(null);
      setSelectedSectionId(null);
      setSelectedWireId(null);

      // Start Marquee drag
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      setMarquee({
        active: true,
        startX,
        startY,
        currentX: startX,
        currentY: startY,
      });

      const onMouseMove = (moveEvt: MouseEvent) => {
        setMarquee((prev) => ({
          ...prev,
          currentX: moveEvt.clientX - rect.left,
          currentY: moveEvt.clientY - rect.top,
        }));
      };

      const onMouseUp = () => {
        setMarquee((prev) => ({ ...prev, active: false }));
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
  };

  const cursorClass = isPanning
    ? "cursor-grabbing"
    : isSpacePressed || tool === "hand"
      ? "cursor-grab"
      : tool === "frame" || tool === "section"
        ? "cursor-crosshair"
        : "cursor-default";

  // Dynamic wire bezier path calculation based on live screen positions
  const getWirePath = (wire: PrototypeWire) => {
    const s1 = screenPositions[wire.sourceScreenId];
    const s2 = screenPositions[wire.targetScreenId];
    if (!s1 || !s2) return { path: "", midX: 0, midY: 0 };

    let startX = s1.x + s1.w;
    let startY = s1.y + 680;
    let endX = s2.x;
    let endY = s2.y + 360;

    if (wire.id === "wire:explore_to_filter") {
      startX = s1.x;
      startY = s1.y + 110;
      endX = s2.x + s2.w;
      endY = s2.y + 140;
    }

    const dx = Math.abs(endX - startX) * 0.5;
    const c1x = startX + (endX > startX ? dx : -dx);
    const c1y = startY;
    const c2x = endX - (endX > startX ? dx : -dx);
    const c2y = endY;

    const path = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return { path, midX, midY, startX, startY, endX, endY };
  };

  // Selected wire object
  const activeWire = prototypeWires.find((w) => w.id === selectedWireId);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Infinite pan-zoom design canvas viewport
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      className={`relative h-full w-full overflow-hidden select-none ${
        showGrid
          ? "bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
          : ""
      } bg-[#0c1017] ${cursorClass}`}
    >
      {/* ── Figma Canvas Top Toolbar ───────────────────────────────── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/95 px-2.5 py-1.5 shadow-2xl shadow-black/80 backdrop-blur-md">
        {/* Tool: Select */}
        <button
          type="button"
          onClick={() => setTool("select")}
          title="Move Tool (V)"
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
            tool === "select"
              ? "bg-[#0d99ff] text-white shadow-xs"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <MousePointer2 className="h-4 w-4" />
          <span className="font-mono text-[10px] opacity-75">V</span>
        </button>

        {/* Tool: Hand (Pan) */}
        <button
          type="button"
          onClick={() => setTool("hand")}
          title="Hand Tool / Pan (H or Space + Drag)"
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
            tool === "hand"
              ? "bg-[#0d99ff] text-white shadow-xs"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <Hand className="h-4 w-4" />
          <span className="font-mono text-[10px] opacity-75">H</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Tool: Frame (F) + Presets Dropdown (Like OpenPencil & Figma) */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setTool("frame")}
            title="Frame Tool (F) · Drag or click canvas to create frame"
            className={`flex h-8 items-center gap-1.5 rounded-l-lg px-2.5 text-xs font-medium transition-colors ${
              tool === "frame"
                ? "bg-[#0d99ff] text-white shadow-xs"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Frame className="h-4 w-4" />
            <span className="font-mono text-[10px] opacity-75">F</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            title="Frame Device Presets (iPhone, iPad, Desktop)"
            className={`flex h-8 items-center px-1.5 rounded-r-lg border-l border-slate-800/80 text-xs transition-colors ${
              tool === "frame"
                ? "bg-[#0d99ff] text-white hover:bg-blue-600"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* Preset Flyout Menu */}
          {showPresetMenu && (
            <div className="absolute top-10 left-0 z-50 w-56 rounded-xl border border-slate-800 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Frame Presets (Figma / OpenPencil)
              </div>
              {(
                [
                  {
                    id: "iphone14",
                    label: "iPhone 13 & 14",
                    size: "360 × 780",
                    icon: Smartphone,
                  },
                  {
                    id: "iphone16",
                    label: "iPhone 16 Pro",
                    size: "393 × 852",
                    icon: Smartphone,
                  },
                  {
                    id: "ipad",
                    label: "iPad Mini",
                    size: "768 × 1024",
                    icon: Tablet,
                  },
                  {
                    id: "desktop",
                    label: "Desktop HD",
                    size: "1440 × 900",
                    icon: Monitor,
                  },
                ] as const
              ).map((p) => {
                const IconComponent = p.icon;
                const isSelectedPreset = selectedFramePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedFramePreset(p.id);
                      setTool("frame");
                      setShowPresetMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                      isSelectedPreset
                        ? "bg-[#0d99ff] text-white font-medium"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-3.5 w-3.5 opacity-80" />
                      <span>{p.label}</span>
                    </div>
                    <span className="font-mono text-[10px] opacity-75">
                      {p.size}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tool: Section (S) (Workflow boundary like OpenPencil & Figma) */}
        <button
          type="button"
          onClick={() => setTool("section")}
          title="Section Tool (S) · Drag or click to create workflow grouping section"
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
            tool === "section"
              ? "bg-[#0d99ff] text-white shadow-xs"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>Section</span>
          <span className="font-mono text-[10px] opacity-75">S</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Mode: Design vs Prototype */}
        <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800/80">
          <button
            type="button"
            onClick={() => setMode("design")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              mode === "design"
                ? "bg-slate-800 text-cyan-400 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Design</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("prototype")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              mode === "prototype"
                ? "bg-[#0d99ff] text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Prototype</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Present (Play Prototype) Button */}
        <button
          type="button"
          onClick={() => setIsPresenting(true)}
          title="Play interactive prototype runner"
          className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600/20 px-3 text-xs font-bold text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-all shadow-xs"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>Present</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Minimap & Grid Toggles */}
        <button
          type="button"
          onClick={() => setShowMinimap(!showMinimap)}
          title="Toggle Canvas Minimap"
          className={`h-8 w-8 rounded-lg text-xs flex items-center justify-center transition-colors ${
            showMinimap
              ? "bg-slate-800 text-cyan-400"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <Compass className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Grid"
          className={`h-8 w-8 rounded-lg text-xs flex items-center justify-center transition-colors ${
            showGrid
              ? "bg-slate-800 text-cyan-400"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <Grid3x3 className="h-4 w-4" />
        </button>

        {/* Alt Smart Guides indicator */}
        <span
          className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
            isAltPressed
              ? "border-rose-500/50 bg-rose-950/60 text-rose-300 font-bold"
              : "border-slate-800 text-slate-500"
          }`}
        >
          <Ruler className="h-3 w-3" />
          <span>Alt: Guides {isAltPressed ? "Active" : ""}</span>
        </span>
      </div>

      {/* ── Marquee Selection Rectangle Overlay ─────────────────────── */}
      {marquee.active && (
        <div
          style={{
            left: `${Math.min(marquee.startX, marquee.currentX)}px`,
            top: `${Math.min(marquee.startY, marquee.currentY)}px`,
            width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
            height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
          }}
          className="pointer-events-none absolute z-40 border border-[#0d99ff] bg-[#0d99ff]/15 rounded-xs"
        />
      )}

      {/* ── Interactive Creation Rubberband Overlay (Frame / Section) ── */}
      {creationBox.active && (
        <div
          style={{
            left: `${Math.min(creationBox.startX, creationBox.currentX)}px`,
            top: `${Math.min(creationBox.startY, creationBox.currentY)}px`,
            width: `${Math.abs(creationBox.currentX - creationBox.startX)}px`,
            height: `${Math.abs(creationBox.currentY - creationBox.startY)}px`,
          }}
          className={`pointer-events-none absolute z-40 rounded-xl border-2 ${
            creationBox.tool === "section"
              ? "border-dashed border-violet-400 bg-violet-500/10"
              : "border-solid border-[#0d99ff] bg-[#0d99ff]/15"
          }`}
        >
          <div className="absolute -top-7 left-0 rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono font-semibold text-white shadow-md border border-slate-700 whitespace-nowrap">
            {creationBox.tool === "section" ? "📁 Section: " : "🔲 Frame: "}
            {Math.round(
              Math.abs(creationBox.currentX - creationBox.startX) / zoom,
            )}{" "}
            ×{" "}
            {Math.round(
              Math.abs(creationBox.currentY - creationBox.startY) / zoom,
            )}
          </div>
        </div>
      )}

      {/* ── Minimap / Radar (Like Penpot & tldraw) ─────────────────── */}
      {showMinimap && (
        <div className="absolute bottom-4 left-4 z-30 flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1.5">
            <span>CANVAS RADAR</span>
            <span className="font-mono text-cyan-400">3 Screens</span>
          </div>
          <div className="relative h-24 w-40 rounded-lg bg-slate-950 border border-slate-800/80 overflow-hidden">
            {/* Artboard thumbnails */}
            {Object.entries(screenPositions).map(([id, pos]) => (
              <div
                key={id}
                style={{
                  left: `${(pos.x / 1400) * 100}%`,
                  top: `${(pos.y / 900) * 100}%`,
                  width: `${(pos.w / 1400) * 100}%`,
                  height: `${(pos.h / 900) * 100}%`,
                }}
                className="absolute rounded-[2px] bg-slate-700/80 border border-cyan-500/40"
              />
            ))}
            {/* Viewport camera box */}
            <div
              style={{
                left: `${Math.max(0, (-pan.x / 1400) * 100)}%`,
                top: `${Math.max(0, (-pan.y / 900) * 100)}%`,
                width: `${Math.min(100, (600 / (1400 * zoom)) * 100)}%`,
                height: `${Math.min(100, (400 / (900 * zoom)) * 100)}%`,
              }}
              className="absolute border border-cyan-400 bg-cyan-400/10 pointer-events-none rounded-[1px]"
            />
          </div>
        </div>
      )}

      {/* ── Figma Canvas Bottom-Right Zoom HUD ─────────────────────── */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/95 p-1 shadow-2xl shadow-black/80 backdrop-blur-md">
        <button
          type="button"
          onClick={zoomOut}
          title="Zoom Out (Ctrl -)"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={resetZoom}
          title="Reset to 100%"
          className="px-2 py-1 font-mono text-xs font-semibold text-slate-200 hover:text-cyan-400"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={zoomIn}
          title="Zoom In (Ctrl +)"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={zoomToFit}
          title="Zoom to Fit Canvas"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="text-[11px]">Fit</span>
        </button>
      </div>

      {/* ── Transformable Canvas Stage ─────────────────────────────── */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          transition: isPanning ? "none" : "transform 0.05s ease-out",
        }}
        className="relative w-max h-max will-change-transform"
      >
        {children}

        {/* ── Dynamic Prototype Wires Overlay (When Prototype Mode Active) ─── */}
        {mode === "prototype" && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="figma-arrow-head"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0d99ff" />
              </marker>
              <marker
                id="figma-arrow-head-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
            </defs>

            {prototypeWires.map((wire) => {
              const { path, midX, midY } = getWirePath(wire);
              if (!path) return null;
              const isSelectedWire = selectedWireId === wire.id;

              return (
                <g key={wire.id} className="pointer-events-auto cursor-pointer">
                  {/* Outer glow stroke on hover or select */}
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: Prototype wire click selection */}
                  <path
                    d={path}
                    fill="none"
                    stroke={isSelectedWire ? "#38bdf8" : "transparent"}
                    strokeWidth={isSelectedWire ? "8" : "16"}
                    strokeOpacity={isSelectedWire ? 0.3 : 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWireId(wire.id);
                    }}
                  />
                  {/* Primary wire curve */}
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: Prototype wire curve click selection */}
                  <path
                    d={path}
                    fill="none"
                    stroke={isSelectedWire ? "#38bdf8" : "#0d99ff"}
                    strokeWidth={isSelectedWire ? "3.5" : "2.5"}
                    strokeDasharray={isSelectedWire ? "none" : "5 3"}
                    markerEnd={
                      isSelectedWire
                        ? "url(#figma-arrow-head-active)"
                        : "url(#figma-arrow-head)"
                    }
                    className={isSelectedWire ? "" : "animate-pulse"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWireId(wire.id);
                    }}
                  />
                  {/* Interaction chip pill */}
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: Prototype wire label badge click */}
                  <g
                    transform={`translate(${midX}, ${midY})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWireId(wire.id);
                    }}
                  >
                    <rect
                      x="-60"
                      y="-12"
                      width="120"
                      height="24"
                      rx="12"
                      fill={isSelectedWire ? "#0284c7" : "#0d99ff"}
                      className="shadow-lg transition-transform hover:scale-105"
                    />
                    <text
                      x="0"
                      y="4"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {wire.trigger}: {wire.action} ➔
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        )}

        {/* ── Figma Interaction Details Popover (When a Wire is Selected) ── */}
        {mode === "prototype" && activeWire && (
          <div
            style={{
              position: "absolute",
              left: `${getWirePath(activeWire).midX + 20}px`,
              top: `${getWirePath(activeWire).midY - 40}px`,
            }}
            className="z-40 w-72 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur-md font-sans"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 font-semibold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Zap className="h-3.5 w-3.5" />
                <span>Interaction Details</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedWireId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Trigger
                </span>
                <select
                  value={activeWire.trigger}
                  onChange={(e) =>
                    updateWire(activeWire.id, {
                      trigger: e.target.value as PrototypeWire["trigger"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="click">On click</option>
                  <option value="hover">While hovering</option>
                  <option value="drag">On drag</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Action
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200">
                  <span className="font-semibold text-cyan-400">
                    Navigate to
                  </span>
                  <span>➔</span>
                  <span className="font-semibold text-white">
                    {screenPositions[activeWire.targetScreenId]?.title ??
                      activeWire.targetScreenId}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Animation
                </span>
                <select
                  value={activeWire.animation}
                  onChange={(e) =>
                    updateWire(activeWire.id, {
                      animation: e.target.value as PrototypeWire["animation"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="smart-animate">Smart Animate (300ms)</option>
                  <option value="slide-in">Slide In (250ms)</option>
                  <option value="dissolve">Dissolve (200ms)</option>
                  <option value="instant">Instant</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Interactive Prototype Player (Present Mode) ─────────────── */}
      <FigmaPrototypePlayer />
    </div>
  );
}
