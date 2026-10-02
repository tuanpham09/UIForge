"use client";

import type { ViewportPreset } from "@uiforge/renderer";
import { dashboardFixture } from "@uiforge/ui-schema";
import { useState } from "react";
import AiPromptBar from "./components/ai-prompt-bar";
import CodeSpecView from "./components/code-spec-view";
import { FigmaCanvasProvider } from "./components/figma-canvas-context";
import FlowGraphView from "./components/flow-graph-view";
import StudioHeader, { type StudioViewMode } from "./components/studio-header";
import StudioInspector from "./components/studio-inspector";
import StudioSidebar from "./components/studio-sidebar";
import EditorCanvas from "./editor-canvas";
import RendererPreview from "./renderer-preview";

interface StudioWorkspaceProps {
  initialPreset: ViewportPreset;
}

export default function StudioWorkspace({
  initialPreset,
}: StudioWorkspaceProps) {
  const [activeMode, setActiveMode] = useState<StudioViewMode | "split">(
    "split",
  );
  const [activeScreenId, setActiveScreenId] = useState<string>(
    dashboardFixture.screens[0]?.id ?? "screen.dashboard",
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    "dashboard.cta",
  );
  const [isAiPromptOpen, setIsAiPromptOpen] = useState(false);

  const activeScreen = dashboardFixture.screens.find(
    (s) => s.id === activeScreenId,
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Top Header */}
      <StudioHeader
        activeMode={activeMode === "split" ? "preview" : activeMode}
        onModeChange={(mode) => setActiveMode(mode)}
        onToggleAiPrompt={() => setIsAiPromptOpen((prev) => !prev)}
        isAiPromptOpen={isAiPromptOpen}
        activeScreenName={activeScreen?.name ?? "Dashboard"}
      />

      {/* Sub-header Bar (Includes Canonical Heading for E2E and Context) */}
      <div className="flex h-9 items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <h1 className="font-medium text-slate-300">
            Canonical UI Schema → Editor + Preview
          </h1>
          <span className="hidden text-slate-500 md:inline">·</span>
          <span className="hidden text-slate-400 md:inline">
            Schema is canonical; canvas and code are projections.
          </span>
        </div>

        {/* Studio View Selector */}
        <div className="flex items-center gap-1 rounded bg-slate-950 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveMode("split")}
            className={`rounded px-2 py-0.5 font-medium transition-colors ${
              activeMode === "split"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("preview")}
            className={`rounded px-2 py-0.5 font-medium transition-colors ${
              activeMode === "preview"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Preview Focus
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("canvas")}
            className={`rounded px-2 py-0.5 font-medium transition-colors ${
              activeMode === "canvas"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Canvas Focus
          </button>
        </div>
      </div>

      {/* Main Studio Body: Sidebar + Stage + Inspector */}
      <FigmaCanvasProvider
        initialSelectedNodeId={selectedNodeId}
        onNodeSelect={(id) => setSelectedNodeId(id)}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <StudioSidebar
            document={dashboardFixture}
            activeScreenId={activeScreenId}
            onSelectScreen={(id) => setActiveScreenId(id)}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
          />

          {/* Center Stage Workspace */}
          <main className="relative flex flex-1 flex-col overflow-hidden bg-slate-900/30">
            {activeMode === "split" && (
              <div className="grid h-full w-full grid-cols-1 divide-y divide-slate-800 overflow-auto lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                {/* Left Pane: Deterministic Preview */}
                <div className="flex h-full flex-col overflow-hidden">
                  <div className="border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Deterministic Web Preview
                  </div>
                  <div className="flex-1 overflow-auto">
                    <RendererPreview
                      initialPreset={initialPreset}
                      activeScreenId={activeScreenId}
                      onScreenChange={(id) => setActiveScreenId(id)}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={(id) => setSelectedNodeId(id)}
                    />
                  </div>
                </div>

                {/* Right Pane: Editor Canvas (tldraw) */}
                <div className="relative isolate flex h-full flex-col overflow-hidden">
                  <div className="border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Interactive Editor Canvas (Projection)
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <EditorCanvas
                      onSelectScreen={(screenId) => setActiveScreenId(screenId)}
                      onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
                      activeScreenId={activeScreenId}
                      selectedNodeId={selectedNodeId}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeMode === "preview" && (
              <div className="h-full w-full overflow-hidden">
                <RendererPreview
                  initialPreset={initialPreset}
                  activeScreenId={activeScreenId}
                  onScreenChange={(id) => setActiveScreenId(id)}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(id) => setSelectedNodeId(id)}
                />
              </div>
            )}

            {activeMode === "canvas" && (
              <div className="relative isolate h-full w-full overflow-hidden">
                <EditorCanvas
                  onSelectScreen={(screenId) => setActiveScreenId(screenId)}
                  onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
                  activeScreenId={activeScreenId}
                  selectedNodeId={selectedNodeId}
                />
              </div>
            )}

            {activeMode === "flow-graph" && (
              <FlowGraphView
                document={dashboardFixture}
                onSelectScreen={(screenId) => {
                  setActiveScreenId(screenId);
                  setActiveMode("preview");
                }}
              />
            )}

            {activeMode === "code-spec" && <CodeSpecView />}
          </main>

          {/* Right Inspector */}
          <StudioInspector
            document={dashboardFixture}
            activeScreenId={activeScreenId}
            selectedNodeId={selectedNodeId}
            onOpenAiPrompt={() => setIsAiPromptOpen(true)}
          />
        </div>
      </FigmaCanvasProvider>

      {/* Floating AI Prompt Bar */}
      <AiPromptBar
        isOpen={isAiPromptOpen}
        onClose={() => setIsAiPromptOpen(false)}
        selectedNodeId={selectedNodeId}
        activeScreenId={activeScreenId}
      />
    </div>
  );
}
