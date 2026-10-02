"use client";

import { FolderKanban, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { type CanvasSection, useFigmaCanvas } from "./figma-canvas-context";

interface FigmaSectionProps {
  section: CanvasSection;
}

export default function FigmaSection({ section }: FigmaSectionProps) {
  const {
    tool,
    selectedSectionId,
    setSelectedSectionId,
    updateSection,
    updateSectionPosition,
    deleteSection,
  } = useFigmaCanvas();

  const isSelected = selectedSectionId === section.id;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(section.title);

  // Sync title from props
  useEffect(() => {
    setTitleInput(section.title);
  }, [section.title]);

  // Section Dragging (Header drag moves section and child frames together)
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (tool === "hand") return;
    e.stopPropagation();
    setSelectedSectionId(section.id);

    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: section.x,
      posY: section.y,
    };

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = moveEvt.clientX - dragStart.current.mouseX;
      const dy = moveEvt.clientY - dragStart.current.mouseY;
      updateSectionPosition(
        section.id,
        {
          x: Math.round(dragStart.current.posX + dx),
          y: Math.round(dragStart.current.posY + dy),
        },
        true,
      );
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Section Resizing (8 handles)
  const handleResizeMouseDown = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = section.x;
    const initialY = section.y;
    const initialW = section.w;
    const initialH = section.h;

    const onMouseMove = (moveEvt: MouseEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      let newW = initialW;
      let newH = initialH;
      let newX = initialX;
      let newY = initialY;

      if (handle.includes("e")) newW = Math.max(200, initialW + dx);
      if (handle.includes("s")) newH = Math.max(150, initialH + dy);
      if (handle.includes("w")) {
        const potentialW = initialW - dx;
        if (potentialW >= 200) {
          newW = potentialW;
          newX = initialX + dx;
        }
      }
      if (handle.includes("n")) {
        const potentialH = initialH - dy;
        if (potentialH >= 150) {
          newH = potentialH;
          newY = initialY + dy;
        }
      }

      updateSection(section.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        w: Math.round(newW),
        h: Math.round(newH),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      updateSection(section.id, { title: titleInput.trim() });
    } else {
      setTitleInput(section.title);
    }
    setIsEditingTitle(false);
  };

  const sectionColor = section.color || "#0d99ff";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Section canvas container
    <div
      data-section-id={section.id}
      style={{
        position: "absolute",
        left: `${section.x}px`,
        top: `${section.y}px`,
        width: `${section.w}px`,
        height: `${section.h}px`,
      }}
      className={`group/section select-none z-0 transition-shadow ${
        isSelected ? "z-20" : "z-0"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Section Title Tab (OpenPencil & Figma Header Pill) ─────── */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Header drag and inline rename */}
      <div
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={() => setIsEditingTitle(true)}
        style={{
          borderColor: isSelected ? sectionColor : undefined,
        }}
        className={`absolute -top-9 left-0 flex items-center gap-2 rounded-t-xl px-3 py-1.5 text-xs font-semibold cursor-move transition-all ${
          isSelected
            ? "bg-slate-900 text-white border-t border-x shadow-md"
            : isHovered
              ? "bg-slate-900/90 text-slate-200 border-t border-x border-slate-700"
              : "bg-slate-950/80 text-slate-400 border-t border-x border-slate-800"
        }`}
      >
        <FolderKanban
          className="h-3.5 w-3.5 flex-none"
          style={{ color: sectionColor }}
        />

        {isEditingTitle ? (
          <input
            type="text"
            // biome-ignore lint/a11y/noAutofocus: Autofocus on inline rename
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleTitleSubmit();
              if (e.key === "Escape") {
                setTitleInput(section.title);
                setIsEditingTitle(false);
              }
            }}
            className="w-44 rounded bg-slate-800 px-1.5 py-0.5 font-sans text-xs text-white outline-none ring-1 ring-[#0d99ff]"
          />
        ) : (
          <span title="Double click to rename section">{section.title}</span>
        )}

        <span className="font-mono text-[10px] text-slate-500 font-normal">
          {section.w}×{section.h}
        </span>

        {isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteSection(section.id);
            }}
            title="Delete Section"
            className="ml-1 rounded p-0.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── Section Canvas Boundary (Dashed/Solid Container) ────────── */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Section surface selection */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Section canvas surface */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedSectionId(section.id);
          }
        }}
        style={{
          borderColor: isSelected
            ? sectionColor
            : isHovered
              ? "rgba(100, 116, 139, 0.6)"
              : "rgba(51, 65, 85, 0.4)",
        }}
        className={`h-full w-full rounded-3xl border-2 border-dashed bg-slate-900/15 backdrop-blur-[1px] transition-all pointer-events-auto ${
          isSelected ? "ring-1 shadow-lg shadow-black/40" : ""
        }`}
      />

      {/* ── 8 Resize Handles (Visible when Section is selected) ───────── */}
      {isSelected &&
        [
          {
            id: "nw",
            cursor: "cursor-nwse-resize",
            top: "-5px",
            left: "-5px",
          },
          {
            id: "n",
            cursor: "cursor-ns-resize",
            top: "-5px",
            left: "calc(50% - 4px)",
          },
          {
            id: "ne",
            cursor: "cursor-nesw-resize",
            top: "-5px",
            right: "-5px",
          },
          {
            id: "e",
            cursor: "cursor-ew-resize",
            top: "calc(50% - 4px)",
            right: "-5px",
          },
          {
            id: "se",
            cursor: "cursor-nwse-resize",
            bottom: "-5px",
            right: "-5px",
          },
          {
            id: "s",
            cursor: "cursor-ns-resize",
            bottom: "-5px",
            left: "calc(50% - 4px)",
          },
          {
            id: "sw",
            cursor: "cursor-nesw-resize",
            bottom: "-5px",
            left: "-5px",
          },
          {
            id: "w",
            cursor: "cursor-ew-resize",
            top: "calc(50% - 4px)",
            left: "-5px",
          },
        ].map((h) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: Section resize handle
          <div
            key={h.id}
            onMouseDown={(e) => handleResizeMouseDown(h.id, e)}
            style={{
              top: h.top,
              bottom: h.bottom,
              left: h.left,
              right: h.right,
              borderColor: sectionColor,
            }}
            className={`absolute h-2.5 w-2.5 rounded-xs border-2 bg-white shadow-xs z-30 ${h.cursor}`}
          />
        ))}
    </div>
  );
}
