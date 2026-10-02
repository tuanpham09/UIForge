"use client";

import { Smartphone } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useFigmaCanvas } from "./figma-canvas-context";

interface FigmaArtboardProps {
  screenId: string;
  defaultX: number;
  defaultY: number;
  width?: number;
  height?: number;
  device?: string;
  title: string;
  children: React.ReactNode;
}

export default function FigmaArtboard({
  screenId,
  defaultX,
  defaultY,
  width = 360,
  height = 780,
  device = "iPhone 13 & 14",
  title,
  children,
}: FigmaArtboardProps) {
  const {
    screenPositions,
    updateScreenPosition,
    selectedScreenId,
    setSelectedScreenId,
    setSelectedNodeId,
    tool,
    isAltPressed,
  } = useFigmaCanvas();

  const pos = screenPositions[screenId] ?? {
    x: defaultX,
    y: defaultY,
    w: width,
    h: height,
    title,
    device,
  };

  const isSelected = selectedScreenId === screenId;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(pos.title || title);

  // Dragging Artboard
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (tool === "hand") return;
    e.stopPropagation();
    setSelectedScreenId(screenId);
    setSelectedNodeId(null);

    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = moveEvt.clientX - dragStart.current.mouseX;
      const dy = moveEvt.clientY - dragStart.current.mouseY;
      updateScreenPosition(screenId, {
        x: Math.round(dragStart.current.posX + dx),
        y: Math.round(dragStart.current.posY + dy),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      // Keep title updated in screenPositions if needed
    }
    setIsEditingTitle(false);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Draggable Figma artboard container
    <div
      data-screen-id={screenId}
      style={{
        position: "absolute",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${pos.w}px`,
      }}
      className="group/artboard flex flex-col items-start transition-shadow select-none z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Artboard Header (Draggable Handle like Figma) ─────────── */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Frame title drag handle */}
      <div
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={() => setIsEditingTitle(true)}
        className={`mb-2 flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium cursor-move transition-colors ${
          isSelected
            ? "bg-[#0d99ff] text-white shadow-sm"
            : isHovered
              ? "bg-slate-800 text-slate-200"
              : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Smartphone className="h-3.5 w-3.5 text-cyan-400 group-hover/artboard:text-cyan-300" />
        <span className="font-semibold">{pos.device ?? device}</span>
        <span className="opacity-50">·</span>
        {isEditingTitle ? (
          <input
            type="text"
            // biome-ignore lint/a11y/noAutofocus: Inline rename
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleTitleSubmit();
              if (e.key === "Escape") {
                setTitleInput(pos.title || title);
                setIsEditingTitle(false);
              }
            }}
            className="w-28 rounded bg-slate-900 px-1 py-0.5 text-xs text-white outline-none ring-1 ring-cyan-400"
          />
        ) : (
          <span title="Double click to rename">{pos.title || title}</span>
        )}
        <span className="font-mono text-[10px] opacity-75 ml-1">
          {pos.w}×{pos.h}
        </span>
      </div>

      {/* ── Artboard Frame / Phone Shell ───────────────────────────── */}
      <div
        style={{ height: `${pos.h}px`, width: `${pos.w}px` }}
        className={`relative overflow-hidden rounded-[36px] bg-white text-slate-900 shadow-2xl transition-all flex flex-col ${
          isSelected
            ? "ring-2 ring-[#0d99ff] shadow-blue-500/10"
            : isHovered
              ? "ring-1 ring-slate-600 shadow-black/80"
              : "border border-slate-700/80 shadow-black/70"
        }`}
      >
        {/* iOS Status Bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-xs font-semibold text-black select-none pointer-events-none">
          <span>9:41 AM</span>
          <div className="flex items-center gap-1.5 text-slate-900">
            {/* Cellular Bars */}
            <svg className="h-2.5 w-4" viewBox="0 0 18 12" fill="currentColor">
              <title>Cellular Signal</title>
              <rect x="1" y="9" width="2.5" height="3" rx="0.5" />
              <rect x="5" y="6" width="2.5" height="6" rx="0.5" />
              <rect x="9" y="3" width="2.5" height="9" rx="0.5" />
              <rect x="13" y="0" width="2.5" height="12" rx="0.5" />
            </svg>
            {/* WiFi */}
            <svg
              className="h-2.5 w-3.5"
              viewBox="0 0 16 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <title>Wi-Fi</title>
              <path d="M1 3.5C4.8 0 11.2 0 15 3.5" />
              <path d="M3.5 6.5C6 4.3 10 4.3 12.5 6.5" />
              <circle cx="8" cy="10" r="1.2" fill="currentColor" />
            </svg>
            {/* Battery */}
            <svg
              className="h-2.5 w-5"
              viewBox="0 0 24 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <title>Battery</title>
              <rect x="1" y="1" width="19" height="10" rx="3" />
              <rect
                x="3"
                y="3"
                width="12"
                height="6"
                rx="1.5"
                fill="currentColor"
              />
              <path d="M22 4.5v3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Screen Children Container */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Frame surface click selection */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Frame surface click selection */}
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedScreenId(screenId);
              setSelectedNodeId(null);
            }
          }}
          className="relative flex-1 overflow-hidden flex flex-col"
        >
          {children}
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="flex justify-center pb-2 pt-1 pointer-events-none">
          <div className="h-1 w-32 rounded-full bg-slate-300" />
        </div>
      </div>

      {/* ── Alt Distance to Adjacent Artboards ─────────────────────── */}
      {isAltPressed && isSelected && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded bg-rose-600 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow-md whitespace-nowrap"
        >
          <span>
            X: {pos.x}px · Y: {pos.y}px · Spacing: 140px
          </span>
        </div>
      )}
    </div>
  );
}
