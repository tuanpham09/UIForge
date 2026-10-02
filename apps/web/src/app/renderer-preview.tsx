"use client";

import { defaultTokenSet } from "@uiforge/design-tokens";
import {
  getViewport,
  renderScreen,
  type ViewportPreset,
} from "@uiforge/renderer";
import { dashboardFixture } from "@uiforge/ui-schema";
import { useMemo, useState } from "react";
import FigmaCanvasViewport from "./components/figma-canvas-viewport";
import FigmaMobileCanvas from "./components/figma-mobile-canvas";
import RichDashboardPreview from "./components/rich-dashboard-preview";

interface RendererPreviewProps {
  initialPreset?: ViewportPreset;
  activeScreenId?: string;
  onScreenChange?: (screenId: string) => void;
  onSelectNode?: (nodeId: string | null) => void;
  selectedNodeId?: string | null;
}

const PREVIEW_SCREENS = [
  { id: "figma.canvas", name: "🎨 Figma Canvas (All Screens)", type: "figma" },
  { id: "screen.filter", name: "Filter (iPhone 13 & 14)", type: "mobile" },
  { id: "screen.signup", name: "Sign Up (iPhone)", type: "mobile" },
  { id: "screen.explore", name: "Explore (iPhone)", type: "mobile" },
  { id: "screen.dashboard", name: "FinTech Dashboard", type: "desktop" },
];

export default function RendererPreview({
  initialPreset = "wide",
  activeScreenId,
  onScreenChange,
  onSelectNode,
  selectedNodeId,
}: RendererPreviewProps) {
  const [internalScreenId, setInternalScreenId] =
    useState<string>("figma.canvas");
  const [preset, setPreset] = useState<ViewportPreset>(initialPreset);

  const currentScreenId =
    activeScreenId && activeScreenId !== "screen.dashboard"
      ? activeScreenId
      : internalScreenId;

  const viewport = useMemo(() => getViewport(preset), [preset]);

  // Schema renderer result (used for diagnostics + fallback)
  const result = useMemo(
    () =>
      renderScreen(dashboardFixture, "screen.dashboard", defaultTokenSet, {
        viewport,
      }),
    [viewport],
  );

  const handleSelectScreen = (id: string) => {
    setInternalScreenId(id);
    onScreenChange?.(id === "figma.canvas" ? "screen.dashboard" : id);
  };

  const isFigmaCanvas = currentScreenId === "figma.canvas";
  const isFilter = currentScreenId === "screen.filter";
  const isSignUp = currentScreenId === "screen.signup";
  const isExplore = currentScreenId === "screen.explore";
  const isDashboard = currentScreenId === "screen.dashboard";

  const isMobileFigma = isFigmaCanvas || isFilter || isSignUp || isExplore;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-950 font-sans">
      {/* ── Controls Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs">
        {/* Screen selector chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Figma Artboard:
          </span>
          {PREVIEW_SCREENS.map((screen) => (
            <button
              key={screen.id}
              type="button"
              onClick={() => handleSelectScreen(screen.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                currentScreenId === screen.id
                  ? "bg-cyan-500 text-slate-950 font-semibold shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {screen.name}
            </button>
          ))}
        </div>

        {/* Viewport presets (Preserved for tests & responsive check) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Scale / Preset:
          </span>
          <form
            className="flex flex-wrap items-center gap-1"
            method="get"
            onSubmit={(e) => e.preventDefault()}
          >
            {(["wide", "desktop", "tablet", "mobile"] as const).map((item) => (
              <button
                key={item}
                data-testid={`viewport-${item}`}
                name="viewport"
                type="button"
                value={item}
                onClick={() => setPreset(item)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  preset === item
                    ? "border border-cyan-400/80 bg-cyan-950/60 text-cyan-300 font-semibold"
                    : "border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </form>

          <span
            data-testid="renderer-viewport"
            className="ml-2 rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-cyan-400"
          >
            {viewport.width}×{viewport.height}
          </span>
        </div>
      </div>

      {/* ── Main Canvas (Figma Infinite Workspace with Pan, Zoom & Guides) ── */}
      <div className="relative flex flex-1 overflow-hidden">
        <FigmaCanvasViewport>
          <div
            data-testid="renderer-preview"
            data-screen-id={currentScreenId}
            data-viewport={preset}
            className="relative min-w-full flex justify-center py-6"
          >
            {isMobileFigma ? (
              <FigmaMobileCanvas
                activeScreenFilter={
                  isFigmaCanvas
                    ? "all"
                    : isFilter
                      ? "filter"
                      : isSignUp
                        ? "signup"
                        : "explore"
                }
              />
            ) : isDashboard ? (
              <div className="flex flex-col items-start px-8">
                {/* Artboard Header */}
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span className="font-mono text-slate-500">#</span>
                  <span className="font-semibold text-slate-300">
                    Desktop 1440×900
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-cyan-400 font-semibold">
                    Overview Dashboard
                  </span>
                </div>
                <div
                  style={{ maxWidth: `${viewport.width}px`, width: "100%" }}
                  className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl shadow-black/80"
                >
                  <RichDashboardPreview
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 text-white">{result.element}</div>
            )}
          </div>
        </FigmaCanvasViewport>
      </div>

      {/* ── Diagnostics Bar ─────────────────────────────────────── */}
      <aside
        aria-label="Preview diagnostics"
        data-testid="renderer-diagnostics"
        className="flex flex-wrap items-center gap-2 border-t border-slate-800 bg-slate-900/90 px-4 py-2 text-xs"
      >
        <span className="font-semibold text-slate-400">
          Figma Canvas Engine:
        </span>
        <span className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Pan &amp; Zoom · 8 Handles Resize · Drag Move · Alt Guides ·
          Double-Click Edit
        </span>
        <span className="ml-auto font-mono text-[11px] text-slate-500">
          Renderer: v1.0 · UI Schema v1 · Penpot/Figma Engine
        </span>
      </aside>
    </div>
  );
}
