"use client";

import type React from "react";

interface FigmaSelectionBoxProps {
  nodeId: string;
  label?: string;
  badge?: string; // e.g. "Fill × Hug", "358 × 40", "Hug × Hug"
  selected?: boolean;
  onSelect?: (nodeId: string) => void;
  children: React.ReactNode;
  className?: string;
  semanticType?: string;
}

/**
 * FigmaSelectionBox: Wraps a UI element with 100% authentic Figma canvas selection visuals:
 * - Blue bounding box (#0d99ff)
 * - 4 Corner square handles + 4 Edge midpoint handles
 * - Signature Figma badge below element (e.g. "Fill × Hug")
 * - Hover dashed border preview
 */
export default function FigmaSelectionBox({
  nodeId,
  label,
  badge = "Fill × Hug",
  selected = false,
  onSelect,
  children,
  className = "",
  semanticType,
}: FigmaSelectionBoxProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(nodeId);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: Figma canvas selectable element wrapper
    <div
      role="button"
      tabIndex={0}
      data-node-id={nodeId}
      data-semantic-type={semanticType}
      data-figma-selected={selected ? "true" : "false"}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          onSelect?.(nodeId);
        }
      }}
      className={`group/figma relative transition-all duration-100 outline-none select-none text-left ${className} ${
        selected
          ? "ring-2 ring-[#0d99ff] ring-offset-0 z-20"
          : "hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#0d99ff]/70"
      }`}
    >
      {children}

      {/* ── Figma Selection Handles & Dimension Badge ────────────────── */}
      {selected && (
        <>
          {/* Top-Left Corner Handle */}
          <span
            aria-hidden="true"
            className="absolute -top-1 -left-1 h-2 w-2 rounded-[1px] border border-[#0d99ff] bg-white shadow-xs pointer-events-none"
          />
          {/* Top-Right Corner Handle */}
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 h-2 w-2 rounded-[1px] border border-[#0d99ff] bg-white shadow-xs pointer-events-none"
          />
          {/* Bottom-Left Corner Handle */}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -left-1 h-2 w-2 rounded-[1px] border border-[#0d99ff] bg-white shadow-xs pointer-events-none"
          />
          {/* Bottom-Right Corner Handle */}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 h-2 w-2 rounded-[1px] border border-[#0d99ff] bg-white shadow-xs pointer-events-none"
          />

          {/* Top Midpoint Handle */}
          <span
            aria-hidden="true"
            className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-[1px] border border-[#0d99ff] bg-white pointer-events-none"
          />
          {/* Bottom Midpoint Handle */}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-[1px] border border-[#0d99ff] bg-white pointer-events-none"
          />
          {/* Left Midpoint Handle */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -left-1 -translate-y-1/2 h-1.5 w-1.5 rounded-[1px] border border-[#0d99ff] bg-white pointer-events-none"
          />
          {/* Right Midpoint Handle */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -right-1 -translate-y-1/2 h-1.5 w-1.5 rounded-[1px] border border-[#0d99ff] bg-white pointer-events-none"
          />

          {/* Figma Size / Auto-Layout Pill Badge (Exactly as seen in user's Figma screenshot) */}
          <div
            aria-hidden="true"
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded bg-[#0d99ff] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white shadow-md pointer-events-none whitespace-nowrap"
          >
            <span>{badge}</span>
            {label && (
              <>
                <span className="opacity-60">·</span>
                <span className="font-normal opacity-90">{label}</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
