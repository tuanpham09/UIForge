"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FigmaTool = "select" | "hand" | "frame" | "section" | "text";
export type FigmaCanvasMode = "design" | "prototype" | "inspect";
export type FramePresetKey = "iphone14" | "iphone16" | "ipad" | "desktop";

export interface CanvasSection {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string; // Hex or theme color for tag pill and border
}

export interface ElementTransform {
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fill?: string;
  radius?: number;
}

export interface PrototypeWire {
  id: string;
  sourceNodeId: string;
  sourceScreenId: string;
  targetScreenId: string;
  label: string;
  trigger: "click" | "hover" | "submit" | "drag";
  action: "navigate" | "overlay" | "back";
  animation: "smart-animate" | "instant" | "dissolve" | "slide-in";
  durationMs: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  device: string;
}

interface FigmaCanvasContextType {
  pan: { x: number; y: number };
  zoom: number;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;

  tool: FigmaTool;
  setTool: (tool: FigmaTool) => void;
  mode: FigmaCanvasMode;
  setMode: (mode: FigmaCanvasMode) => void;

  selectedFramePreset: FramePresetKey;
  setSelectedFramePreset: (preset: FramePresetKey) => void;

  isAltPressed: boolean;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedScreenId: string | null;
  setSelectedScreenId: (id: string | null) => void;

  // Sections (like OpenPencil & Figma workflow sections)
  sections: Record<string, CanvasSection>;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  addSection: (section: Omit<CanvasSection, "id"> & { id?: string }) => string;
  updateSection: (sectionId: string, partial: Partial<CanvasSection>) => void;
  updateSectionPosition: (
    sectionId: string,
    pos: { x: number; y: number },
    moveChildren?: boolean,
  ) => void;
  deleteSection: (sectionId: string) => void;

  screenPositions: Record<string, ScreenPosition>;
  updateScreenPosition: (
    screenId: string,
    updates: Partial<ScreenPosition>,
  ) => void;
  addScreen: (
    screen: Omit<ScreenPosition, "title"> & { id?: string; title: string },
  ) => string;
  deleteScreen: (screenId: string) => void;

  elementTransforms: Record<string, ElementTransform>;
  updateTransform: (id: string, partial: Partial<ElementTransform>) => void;

  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;

  prototypeWires: PrototypeWire[];
  selectedWireId: string | null;
  setSelectedWireId: (id: string | null) => void;
  updateWire: (wireId: string, partial: Partial<PrototypeWire>) => void;

  isPresenting: boolean;
  setIsPresenting: (val: boolean) => void;

  showMinimap: boolean;
  setShowMinimap: (val: boolean) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;

  activeGuides: { type: "x" | "y"; pos: number }[];
  setActiveGuides: (guides: { type: "x" | "y"; pos: number }[]) => void;
}

export const FRAME_PRESETS: Record<
  FramePresetKey,
  { label: string; w: number; h: number; device: string; icon: string }
> = {
  iphone14: {
    label: "iPhone 13 & 14",
    w: 360,
    h: 780,
    device: "iPhone 13 & 14",
    icon: "phone",
  },
  iphone16: {
    label: "iPhone 16 Pro",
    w: 393,
    h: 852,
    device: "iPhone 16 Pro",
    icon: "phone",
  },
  ipad: {
    label: "iPad Mini",
    w: 768,
    h: 1024,
    device: "iPad Mini",
    icon: "tablet",
  },
  desktop: {
    label: "Desktop HD",
    w: 1440,
    h: 900,
    device: "Desktop (1440×900)",
    icon: "monitor",
  },
};

const DEFAULT_SECTIONS: Record<string, CanvasSection> = {
  "section.mobile_flow": {
    id: "section.mobile_flow",
    title: "Mobile Onboarding & Booking Flow",
    x: 30,
    y: 15,
    w: 1330,
    h: 880,
    color: "#0d99ff",
  },
};

const DEFAULT_SCREENS: Record<string, ScreenPosition> = {
  "screen.signup": {
    x: 60,
    y: 60,
    w: 360,
    h: 780,
    title: "Sign Up",
    device: "iPhone 13 & 14",
  },
  "screen.filter": {
    x: 500,
    y: 60,
    w: 360,
    h: 780,
    title: "Filter",
    device: "iPhone 13 & 14",
  },
  "screen.explore": {
    x: 940,
    y: 60,
    w: 360,
    h: 780,
    title: "Explore",
    device: "iPhone 13 & 14",
  },
};

const DEFAULT_WIRES: PrototypeWire[] = [
  {
    id: "wire:signup_to_filter",
    sourceNodeId: "signup.submit",
    sourceScreenId: "screen.signup",
    targetScreenId: "screen.filter",
    label: "On click ➔ Navigate to Filter",
    trigger: "click",
    action: "navigate",
    animation: "smart-animate",
    durationMs: 300,
  },
  {
    id: "wire:filter_to_explore",
    sourceNodeId: "filter.apply",
    sourceScreenId: "screen.filter",
    targetScreenId: "screen.explore",
    label: "On click ➔ Navigate to Explore",
    trigger: "click",
    action: "navigate",
    animation: "smart-animate",
    durationMs: 300,
  },
  {
    id: "wire:explore_to_filter",
    sourceNodeId: "explore.back",
    sourceScreenId: "screen.explore",
    targetScreenId: "screen.filter",
    label: "On click ➔ Back to Filter",
    trigger: "click",
    action: "back",
    animation: "slide-in",
    durationMs: 250,
  },
];

const FigmaCanvasContext = createContext<FigmaCanvasContextType | null>(null);

export function FigmaCanvasProvider({
  children,
  initialSelectedNodeId = null,
  onNodeSelect,
}: {
  children: React.ReactNode;
  initialSelectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string | null) => void;
}) {
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [zoom, setZoom] = useState(0.85);
  const [tool, setTool] = useState<FigmaTool>("select");
  const [mode, setMode] = useState<FigmaCanvasMode>("design");
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [selectedFramePreset, setSelectedFramePreset] =
    useState<FramePresetKey>("iphone14");

  const [selectedNodeId, setInternalSelectedNodeId] = useState<string | null>(
    initialSelectedNodeId,
  );
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Sections (Workflow group containers like Figma & OpenPencil)
  const [sections, setSections] =
    useState<Record<string, CanvasSection>>(DEFAULT_SECTIONS);

  // Screen positions (Artboard frames)
  const [screenPositions, setScreenPositions] =
    useState<Record<string, ScreenPosition>>(DEFAULT_SCREENS);

  // Live transform overrides per element (for move & resize)
  const [elementTransforms, setElementTransforms] = useState<
    Record<string, ElementTransform>
  >({});

  // Prototype wires
  const [prototypeWires, setPrototypeWires] =
    useState<PrototypeWire[]>(DEFAULT_WIRES);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Present modal (live prototype runner)
  const [isPresenting, setIsPresenting] = useState(false);

  // Minimap & Grid
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Active snap guides
  const [activeGuides, setActiveGuides] = useState<
    { type: "x" | "y"; pos: number }[]
  >([]);

  const setSelectedNodeId = (id: string | null) => {
    setInternalSelectedNodeId(id);
    if (id) {
      setSelectedScreenId(null);
      setSelectedSectionId(null);
      setSelectedWireId(null);
    }
    onNodeSelect?.(id);
  };

  const handleSetSelectedScreenId = (id: string | null) => {
    setSelectedScreenId(id);
    if (id) {
      setInternalSelectedNodeId(null);
      setSelectedSectionId(null);
      setSelectedWireId(null);
    }
  };

  const handleSetSelectedSectionId = (id: string | null) => {
    setSelectedSectionId(id);
    if (id) {
      setInternalSelectedNodeId(null);
      setSelectedScreenId(null);
      setSelectedWireId(null);
    }
  };

  // Section Management
  const addSection = (
    sec: Omit<CanvasSection, "id"> & { id?: string },
  ): string => {
    const id = sec.id ?? `section.${Date.now()}`;
    const newSection: CanvasSection = {
      id,
      title: sec.title || "New Section",
      x: Math.round(sec.x),
      y: Math.round(sec.y),
      w: Math.max(200, Math.round(sec.w)),
      h: Math.max(150, Math.round(sec.h)),
      color: sec.color || "#0d99ff",
    };
    setSections((prev) => ({ ...prev, [id]: newSection }));
    handleSetSelectedSectionId(id);
    return id;
  };

  const updateSection = (id: string, partial: Partial<CanvasSection>) => {
    setSections((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: { ...current, ...partial },
      };
    });
  };

  const updateSectionPosition = (
    sectionId: string,
    pos: { x: number; y: number },
    moveChildren = true,
  ) => {
    setSections((prev) => {
      const current = prev[sectionId];
      if (!current) return prev;
      const dx = Math.round(pos.x - current.x);
      const dy = Math.round(pos.y - current.y);

      // Move enclosed frames together (OpenPencil / Figma behavior)
      if (moveChildren && (dx !== 0 || dy !== 0)) {
        setScreenPositions((screenPrev) => {
          const updated = { ...screenPrev };
          for (const [sId, sPos] of Object.entries(screenPrev)) {
            // Check if screen center was within section
            const centerX = sPos.x + sPos.w / 2;
            const centerY = sPos.y + sPos.h / 2;
            if (
              centerX >= current.x &&
              centerX <= current.x + current.w &&
              centerY >= current.y &&
              centerY <= current.y + current.h
            ) {
              updated[sId] = {
                ...sPos,
                x: sPos.x + dx,
                y: sPos.y + dy,
              };
            }
          }
          return updated;
        });
      }

      return {
        ...prev,
        [sectionId]: {
          ...current,
          x: Math.round(pos.x),
          y: Math.round(pos.y),
        },
      };
    });
  };

  const deleteSection = useCallback((sectionId: string) => {
    setSections((prev) => {
      const copy = { ...prev };
      delete copy[sectionId];
      return copy;
    });
    setSelectedSectionId((prev) => (prev === sectionId ? null : prev));
  }, []);

  // Screen / Frame Management
  const addScreen = (
    screen: Omit<ScreenPosition, "title"> & { id?: string; title: string },
  ): string => {
    const id = screen.id ?? `screen.${Date.now()}`;
    const newScreen: ScreenPosition = {
      x: Math.round(screen.x),
      y: Math.round(screen.y),
      w: Math.round(screen.w),
      h: Math.round(screen.h),
      title: screen.title || "Untitled Frame",
      device: screen.device || "Custom Frame",
    };
    setScreenPositions((prev) => ({ ...prev, [id]: newScreen }));
    handleSetSelectedScreenId(id);
    return id;
  };

  const deleteScreen = (screenId: string) => {
    setScreenPositions((prev) => {
      const copy = { ...prev };
      delete copy[screenId];
      return copy;
    });
    if (selectedScreenId === screenId) setSelectedScreenId(null);
  };

  const updateScreenPosition = (
    screenId: string,
    updates: Partial<ScreenPosition>,
  ) => {
    setScreenPositions((prev) => {
      const current = prev[screenId];
      if (!current) return prev;
      return {
        ...prev,
        [screenId]: {
          ...current,
          ...updates,
        },
      };
    });
  };

  const updateTransform = (id: string, partial: Partial<ElementTransform>) => {
    setElementTransforms((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { x: 0, y: 0, w: 0, h: 0 }),
        ...partial,
      },
    }));
  };

  const updateWire = (wireId: string, partial: Partial<PrototypeWire>) => {
    setPrototypeWires((prev) =>
      prev.map((w) => (w.id === wireId ? { ...w, ...partial } : w)),
    );
  };

  const zoomIn = () =>
    setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100));
  const zoomOut = () =>
    setZoom((z) => Math.max(0.25, Math.round((z - 0.15) * 100) / 100));
  const resetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };
  const zoomToFit = () => {
    setZoom(0.75);
    setPan({ x: 40, y: 40 });
  };

  // Global Alt & Keyboard shortcuts (V for select, H for hand, F for frame, S for section)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltPressed(true);
      if (e.key === "Escape") {
        setEditingTextId(null);
        setSelectedWireId(null);
        setIsPresenting(false);
        setTool("select");
      }
      if (
        (e.target as HTMLElement).tagName !== "INPUT" &&
        (e.target as HTMLElement).tagName !== "TEXTAREA"
      ) {
        if (e.key === "v" || e.key === "V") setTool("select");
        if (e.key === "h" || e.key === "H") setTool("hand");
        if (e.key === "f" || e.key === "F") setTool("frame");
        if (e.key === "s" || e.key === "S") setTool("section");
        if (e.key === "Delete" || e.key === "Backspace") {
          if (
            selectedSectionId &&
            selectedSectionId !== "section.mobile_flow"
          ) {
            deleteSection(selectedSectionId);
          }
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedSectionId, deleteSection]);

  return (
    <FigmaCanvasContext.Provider
      value={{
        pan,
        zoom,
        setPan,
        setZoom,
        zoomIn,
        zoomOut,
        zoomToFit,
        resetZoom,
        tool,
        setTool,
        mode,
        setMode,
        selectedFramePreset,
        setSelectedFramePreset,
        isAltPressed,
        selectedNodeId,
        setSelectedNodeId,
        selectedScreenId,
        setSelectedScreenId: handleSetSelectedScreenId,
        sections,
        selectedSectionId,
        setSelectedSectionId: handleSetSelectedSectionId,
        addSection,
        updateSection,
        updateSectionPosition,
        deleteSection,
        screenPositions,
        updateScreenPosition,
        addScreen,
        deleteScreen,
        elementTransforms,
        updateTransform,
        editingTextId,
        setEditingTextId,
        prototypeWires,
        selectedWireId,
        setSelectedWireId,
        updateWire,
        isPresenting,
        setIsPresenting,
        showMinimap,
        setShowMinimap,
        showGrid,
        setShowGrid,
        activeGuides,
        setActiveGuides,
      }}
    >
      {children}
    </FigmaCanvasContext.Provider>
  );
}

export function useFigmaCanvas() {
  const context = useContext(FigmaCanvasContext);
  if (!context) {
    throw new Error("useFigmaCanvas must be used within a FigmaCanvasProvider");
  }
  return context;
}
