"use client";

import type React from "react";
import { useRef, useState } from "react";
import { useFigmaCanvas } from "./figma-canvas-context";

interface FigmaElementProps {
  nodeId: string;
  label?: string;
  badge?: string; // e.g. "Fill × Hug", "358 × 40"
  initialText?: string;
  initialWidth?: number;
  initialHeight?: number;
  semanticType?: string;
  className?: string;
  children: React.ReactNode;
  isTextEditable?: boolean;
}

export default function FigmaElement({
  nodeId,
  label,
  badge = "Fill × Hug",
  initialText,
  initialWidth,
  initialHeight,
  semanticType,
  className = "",
  children,
  isTextEditable = false,
}: FigmaElementProps) {
  const {
    selectedNodeId,
    setSelectedNodeId,
    isAltPressed,
    mode,
    tool,
    elementTransforms,
    updateTransform,
    editingTextId,
    setEditingTextId,
  } = useFigmaCanvas();

  const isSelected = selectedNodeId === nodeId;
  const isEditing = editingTextId === nodeId;
  const transform = elementTransforms[nodeId] ?? {
    x: 0,
    y: 0,
    w: initialWidth ?? 0,
    h: initialHeight ?? 0,
    text: initialText,
  };

  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Drag-to-move state
  const isDraggingMove = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const startTransform = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Handle click / select
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === "hand") return;
    setSelectedNodeId(nodeId);
  };

  // Double click for inline text editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isTextEditable) {
      e.stopPropagation();
      setEditingTextId(nodeId);
    }
  };

  // Drag to Move element
  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === "hand" || isEditing) return;
    if ((e.target as HTMLElement).dataset.handle) return;

    e.stopPropagation();
    setSelectedNodeId(nodeId);

    isDraggingMove.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startTransform.current = { ...transform };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingMove.current) return;
      const dx = moveEvent.clientX - dragStartPos.current.x;
      const dy = moveEvent.clientY - dragStartPos.current.y;
      updateTransform(nodeId, {
        x: Math.round(startTransform.current.x + dx),
        y: Math.round(startTransform.current.y + dy),
      });
    };

    const handleMouseUp = () => {
      isDraggingMove.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Handle Resize from 8 handles
  const handleResizeStart = (
    e: React.MouseEvent,
    direction: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
  ) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW =
      transform.w > 0 ? transform.w : (elementRef.current?.offsetWidth ?? 100);
    const startH =
      transform.h > 0 ? transform.h : (elementRef.current?.offsetHeight ?? 40);

    const onMouseMove = (moveEvt: MouseEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      let nextW = startW;
      let nextH = startH;

      if (direction.includes("e")) nextW = Math.max(20, startW + dx);
      if (direction.includes("w")) nextW = Math.max(20, startW - dx);
      if (direction.includes("s")) nextH = Math.max(16, startH + dy);
      if (direction.includes("n")) nextH = Math.max(16, startH - dy);

      updateTransform(nodeId, {
        w: Math.round(nextW),
        h: Math.round(nextH),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const customStyle: React.CSSProperties = {
    transform:
      transform.x || transform.y
        ? `translate(${transform.x}px, ${transform.y}px)`
        : undefined,
    width: transform.w > 0 ? `${transform.w}px` : undefined,
    height: transform.h > 0 ? `${transform.h}px` : undefined,
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Interactive Figma canvas layer element
    <div
      ref={elementRef}
      data-node-id={nodeId}
      data-semantic-type={semanticType}
      data-figma-selected={isSelected ? "true" : "false"}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setSelectedNodeId(nodeId);
      }}
      style={customStyle}
      className={`group/figma relative min-w-[24px] min-h-[24px] cursor-pointer select-none transition-shadow before:absolute before:-inset-2 before:content-[''] before:z-0 ${className} ${
        isSelected
          ? "ring-2 ring-[#0d99ff] ring-offset-0 z-20 cursor-move"
          : isHovered
            ? "outline outline-1 outline-dashed outline-[#0d99ff]/80"
            : ""
      }`}
    >
      {/* Inline Text Editor */}
      {isEditing ? (
        <input
          // biome-ignore lint/a11y/noAutofocus: Figma inline editing must autofocus on double click
          autoFocus
          type="text"
          value={transform.text ?? initialText ?? ""}
          onChange={(e) => updateTransform(nodeId, { text: e.target.value })}
          onBlur={() => setEditingTextId(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditingTextId(null);
            e.stopPropagation();
          }}
          className="w-full bg-blue-500/20 px-1 py-0.5 font-inherit text-inherit outline-none ring-2 ring-[#0d99ff] rounded relative z-10"
        />
      ) : transform.text ? (
        <span className="inline-block w-full pointer-events-none relative z-10">
          {transform.text}
        </span>
      ) : (
        <div className="pointer-events-none w-full h-full relative z-10">
          {children}
        </div>
      )}

      {/* ── Figma 8 Handles on Selected ─────────────────────────────── */}
      {isSelected && (
        <>
          {/* 4 Corner Square Handles */}
          {(["nw", "ne", "se", "sw"] as const).map((dir) => {
            const posClass =
              dir === "nw"
                ? "-top-1 -left-1"
                : dir === "ne"
                  ? "-top-1 -right-1"
                  : dir === "se"
                    ? "-bottom-1 -right-1"
                    : "-bottom-1 -left-1";
            const cursorClass =
              dir === "nw" || dir === "se"
                ? "cursor-nwse-resize"
                : "cursor-nesw-resize";

            return (
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Resize handle ${dir}`}
                key={dir}
                data-handle={dir}
                onMouseDown={(e) => handleResizeStart(e, dir)}
                className={`absolute ${posClass} ${cursorClass} h-2 w-2 rounded-[1px] border border-[#0d99ff] bg-white shadow-xs z-30 p-0 pointer-events-auto`}
              />
            );
          })}

          {/* 4 Midpoint Edge Handles */}
          {(["n", "e", "s", "w"] as const).map((dir) => {
            const posClass =
              dir === "n"
                ? "-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize"
                : dir === "s"
                  ? "-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize"
                  : dir === "w"
                    ? "top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize"
                    : "top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize";

            return (
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Resize handle ${dir}`}
                key={dir}
                data-handle={dir}
                onMouseDown={(e) => handleResizeStart(e, dir)}
                className={`absolute ${posClass} h-1.5 w-1.5 rounded-[1px] border border-[#0d99ff] bg-white z-30 p-0 pointer-events-auto`}
              />
            );
          })}

          {/* Figma Dimension / Layout Pill Badge */}
          <div
            aria-hidden="true"
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded bg-[#0d99ff] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white shadow-md pointer-events-none whitespace-nowrap"
          >
            <span>
              {transform.w > 0
                ? `${transform.w} × ${transform.h || 40}`
                : badge}
            </span>
            {label && (
              <>
                <span className="opacity-60">·</span>
                <span className="max-w-[120px] truncate">{label}</span>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Alt/Option Key Smart Distance Measurement Guides ────────── */}
      {isAltPressed && isSelected && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 overflow-visible"
        >
          {/* Top Distance Line */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="rounded bg-rose-500 px-1 py-0.2 font-mono text-[8px] font-bold text-white shadow-xs">
              16
            </span>
            <div className="h-4 w-px border-l border-dashed border-rose-500" />
          </div>

          {/* Bottom Distance Line */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="h-4 w-px border-l border-dashed border-rose-500" />
            <span className="rounded bg-rose-500 px-1 py-0.2 font-mono text-[8px] font-bold text-white shadow-xs">
              24
            </span>
          </div>

          {/* Left Distance Line */}
          <div className="absolute top-1/2 -left-8 -translate-y-1/2 flex items-center">
            <span className="rounded bg-rose-500 px-1 py-0.2 font-mono text-[8px] font-bold text-white shadow-xs">
              20
            </span>
            <div className="w-4 h-px border-t border-dashed border-rose-500" />
          </div>

          {/* Right Distance Line */}
          <div className="absolute top-1/2 -right-8 -translate-y-1/2 flex items-center">
            <div className="w-4 h-px border-t border-dashed border-rose-500" />
            <span className="rounded bg-rose-500 px-1 py-0.2 font-mono text-[8px] font-bold text-white shadow-xs">
              20
            </span>
          </div>
        </div>
      )}

      {/* ── Prototype Mode: Connection Dot / Handle ─────────────────── */}
      {mode === "prototype" && (semanticType === "button" || isSelected) && (
        <div
          title="Drag connection wire to target screen"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0d99ff] bg-white text-[#0d99ff] shadow-md transition-transform hover:scale-125 cursor-crosshair animate-pulse"
        >
          <span className="text-[11px] font-bold leading-none">+</span>
        </div>
      )}
    </div>
  );
}
