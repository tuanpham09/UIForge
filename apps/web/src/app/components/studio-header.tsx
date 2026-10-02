"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

export type StudioViewMode = "preview" | "canvas" | "flow-graph" | "code-spec";

interface StudioHeaderProps {
  activeMode: StudioViewMode;
  onModeChange: (mode: StudioViewMode) => void;
  onToggleAiPrompt: () => void;
  isAiPromptOpen: boolean;
  activeScreenName: string;
}

export default function StudioHeader({
  activeMode,
  onModeChange,
  onToggleAiPrompt,
  isAiPromptOpen,
  activeScreenName,
}: StudioHeaderProps) {
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur-md">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-slate-950 shadow-md shadow-cyan-500/20">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <title>UIForge Logo</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-white">
              UIForge{" "}
              <span className="text-xs font-normal text-cyan-400">Studio</span>
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-800 md:block" />

          {/* Project Selector Pill */}
          <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 md:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
            <span className="font-medium text-slate-200">
              FinTech Analytics v2
            </span>
            <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-slate-400">
              rev 7
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{activeScreenName}</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-1">
          <button
            type="button"
            onClick={() => onModeChange("preview")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              activeMode === "preview"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <title>Preview Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview
          </button>

          <button
            type="button"
            onClick={() => onModeChange("canvas")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              activeMode === "canvas"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <title>Canvas Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            Canvas
          </button>

          <button
            type="button"
            onClick={() => onModeChange("flow-graph")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              activeMode === "flow-graph"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <title>Flow Graph Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Flow Graph
          </button>

          <button
            type="button"
            onClick={() => onModeChange("code-spec")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              activeMode === "code-spec"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <title>Code Spec Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            Code Spec
          </button>
        </nav>

        {/* Right Controls: AI CTA & MCP Status */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAiPrompt}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              isAiPromptOpen
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/30"
                : "border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-200 hover:border-cyan-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            <span>AI Prompt</span>
          </button>

          {/* MCP Status Indicator */}
          <button
            type="button"
            onClick={() => setIsMcpModalOpen(true)}
            title="Click to view MCP server details"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/50 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:border-emerald-700 hover:bg-emerald-950/80 hover:text-emerald-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">MCP Active</span>
          </button>
        </div>
      </header>

      {/* MCP Info Modal */}
      {isMcpModalOpen && (
        <McpInfoModal onClose={() => setIsMcpModalOpen(false)} />
      )}
    </>
  );
}

/* ── MCP Info Modal ──────────────────────────────────────────────────── */

const MCP_TOOLS = [
  {
    name: "get_screen",
    description: "Returns semantic UI nodes for a screen ID",
    scope: "read",
  },
  {
    name: "get_layout_tree",
    description: "Returns the layout hierarchy for a screen",
    scope: "read",
  },
  {
    name: "get_design_tokens",
    description: "Returns all resolved design tokens for the active project",
    scope: "read",
  },
  {
    name: "get_component",
    description: "Returns component spec from the registry by ID",
    scope: "read",
  },
  {
    name: "get_code_spec",
    description: "Returns generated React/Tailwind code spec for a screen",
    scope: "read",
  },
  {
    name: "apply_schema_patch",
    description: "Applies a typed UI Schema patch; requires auth capability",
    scope: "mutate",
  },
  {
    name: "get_experience_graph",
    description: "Returns all screen transitions and flow edges",
    scope: "read",
  },
];

const SCOPE_COLORS = {
  read: "bg-blue-950/60 text-blue-400 border-blue-900/40",
  mutate: "bg-amber-950/60 text-amber-400 border-amber-900/40",
};

function McpInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop — full-screen close button */}
      <button
        type="button"
        aria-label="Close MCP modal"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel — stop propagation so clicks inside don't close */}
      <article
        className="relative mx-4 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="MCP Server Information"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-400">
                Connected
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">MCP Server</h2>
              <p className="font-mono text-[11px] text-slate-500">
                http://127.0.0.1:3100/mcp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Close MCP modal"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <title>Close</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Server Meta */}
        <div className="grid grid-cols-3 gap-px border-b border-slate-800 bg-slate-800">
          {[
            { label: "Transport", value: "Streamable HTTP" },
            { label: "Protocol", value: "MCP 2025-03" },
            { label: "Auth", value: "Capability check" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-950 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-200">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tools List */}
        <div className="px-5 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Exposed Tools · {MCP_TOOLS.length} registered
          </p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {MCP_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-800/60 bg-slate-900/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-slate-200">
                    {tool.name}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                    {tool.description}
                  </p>
                </div>
                <span
                  className={`flex-none rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                    SCOPE_COLORS[tool.scope as keyof typeof SCOPE_COLORS]
                  }`}
                >
                  {tool.scope}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
          <p className="text-[11px] text-slate-500">
            Schema is canonical · MCP output is typed + versioned
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </article>
    </div>
  );
}
