"use client";

import { X } from "lucide-react";
import { useState } from "react";

const NODE_LABELS: Record<string, string> = {
  "dashboard.cta": "Open Details Button",
  "dashboard.summary": "Overview Section (KPI Cards)",
  "dashboard.metric.revenue": "Total Revenue Card",
  "dashboard.metric.users": "Active Users Card",
  "dashboard.metric.conversion": "Conversion Card",
  "dashboard.chart": "Dashboard Results Bar Chart",
  "dashboard.deal-status": "Deal Status Panel",
  "dashboard.table": "Company Overview Table",
};

const CONTEXT_CHIPS: Record<string, string[]> = {
  "dashboard.cta": [
    "Change button color to violet",
    "Add loading spinner",
    "Change label to 'View Report'",
  ],
  "dashboard.metric.revenue": [
    "Add currency symbol prefix",
    "Show weekly trend instead",
    "Highlight if above target",
  ],
  "dashboard.metric.users": [
    "Add user avatar stack",
    "Show comparison to last month",
    "Change delta color to blue",
  ],
  "dashboard.metric.conversion": [
    "Add target progress bar",
    "Show per-region breakdown",
    "Change to percentage display",
  ],
  "dashboard.chart": [
    "Add Y-axis labels",
    "Switch to line chart",
    "Add today highlight bar",
  ],
  "dashboard.deal-status": [
    "Add deal owner avatars",
    "Sort by highest amount",
    "Add progress indicator",
  ],
  "dashboard.table": [
    "Add sortable columns",
    "Add row action menu",
    "Color code growth column",
  ],
  default: [
    "+ Add KPI Metric Card",
    "🎨 Switch to Dark Violet Palette",
    "⚡ Add Mobile Responsive Layout",
    "🛡️ Check WCAG Contrast",
  ],
};

interface AiPromptBarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeId?: string | null;
  activeScreenId?: string;
}

export default function AiPromptBar({
  isOpen,
  onClose,
  selectedNodeId,
  activeScreenId,
}: AiPromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const nodeLabel = selectedNodeId
    ? (NODE_LABELS[selectedNodeId] ?? selectedNodeId)
    : null;
  const chips =
    (selectedNodeId
      ? (CONTEXT_CHIPS[selectedNodeId] ?? CONTEXT_CHIPS.default)
      : CONTEXT_CHIPS.default) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);

    const context = selectedNodeId
      ? `node:${selectedNodeId} · screen:${activeScreenId ?? "screen.dashboard"}`
      : `screen:${activeScreenId ?? "screen.dashboard"}`;

    setFeedback(
      `Composing Design Strategy for ${context} · Validating UI Schema…`,
    );

    setTimeout(() => {
      setIsSubmitting(false);
      setFeedback(
        selectedNodeId
          ? `✓ Patch applied to ${nodeLabel} · 1 node updated · Schema validated`
          : "✓ Schema verified! Patch applied across nodes.",
      );
      setTimeout(() => {
        setFeedback(null);
        setPrompt("");
      }, 3000);
    }, 1400);
  };

  const handleChipClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-[80] w-full max-w-2xl -translate-x-1/2 px-4">
      <div className="relative rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-3 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl">
        {/* Header Row */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <span>✨</span>
            <span>AI Design Copilot</span>
            {nodeLabel ? (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  {nodeLabel}
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] font-normal text-slate-400">
                  No node selected · click a node in the preview first
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Prompt Input */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isSubmitting}
            placeholder={
              nodeLabel
                ? `Describe what to change in "${nodeLabel}"…`
                : "Select a node in the preview, then describe your change…"
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 pr-28 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
          <button
            type="submit"
            disabled={isSubmitting || !prompt.trim()}
            className="absolute right-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-all hover:opacity-90 disabled:opacity-40"
          >
            {isSubmitting
              ? "Applying…"
              : selectedNodeId
                ? "Patch Node"
                : "Generate"}
          </button>
        </form>

        {/* Feedback */}
        {feedback && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <span>✓</span>
            <span>{feedback}</span>
          </div>
        )}

        {/* Context-sensitive Quick Chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[10px] text-slate-500">
            {selectedNodeId ? `For ${nodeLabel}:` : "Quick:"}
          </span>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
