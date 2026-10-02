import { FRAME_PRESETS } from "@uiforge/ui-schema";

export type PreviewOrientation = "portrait" | "landscape";
export type PreviewDeviceCategory = "mobile" | "tablet" | "desktop" | "custom";

export interface ViewportState {
  presetId: string;
  width: number;
  height: number;
  orientation: PreviewOrientation;
  zoom: number;
}

export interface ViewportDiagnostic {
  severity: "ok" | "warning" | "error";
  code: "BREAKPOINT" | "OVERFLOW" | "INVALID";
  message: string;
  breakpoint?: string;
}

const MIN_ZOOM = 25;
const MAX_ZOOM = 200;

export const DEVICE_PRESETS = FRAME_PRESETS.filter((preset) =>
  ["mobile", "tablet", "desktop"].includes(preset.category),
);

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value)));
}

export function viewportFromPreset(
  presetId: string,
  orientation: PreviewOrientation = "portrait",
): ViewportState {
  const preset = DEVICE_PRESETS.find((item) => item.id === presetId);
  if (!preset) {
    return {
      presetId: "custom",
      width: 390,
      height: 844,
      orientation: "portrait",
      zoom: 100,
    };
  }

  const portraitWidth = Math.min(preset.width, preset.height);
  const portraitHeight = Math.max(preset.width, preset.height);
  const landscape = orientation === "landscape";
  return {
    presetId: preset.id,
    width: landscape ? portraitHeight : portraitWidth,
    height: landscape ? portraitWidth : portraitHeight,
    orientation: landscape ? "landscape" : "portrait",
    zoom: 100,
  };
}

export function rotateViewport(state: ViewportState): ViewportState {
  return {
    ...state,
    width: state.height,
    height: state.width,
    orientation: state.orientation === "portrait" ? "landscape" : "portrait",
  };
}

export function customViewport(
  width: number,
  height: number,
  zoom = 100,
): ViewportState {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  return {
    presetId: "custom",
    width: safeWidth,
    height: safeHeight,
    orientation: safeWidth <= safeHeight ? "portrait" : "landscape",
    zoom: clampZoom(zoom),
  };
}

export function serializeViewport(state: ViewportState): string {
  const params = new URLSearchParams();
  params.set("viewport", state.presetId);
  params.set("w", String(state.width));
  params.set("h", String(state.height));
  params.set("orientation", state.orientation);
  params.set("zoom", String(state.zoom));
  return params.toString();
}

export function parseViewport(
  params: URLSearchParams,
  fallback = viewportFromPreset("iphone-16"),
): ViewportState {
  const presetId = params.get("viewport") ?? fallback.presetId;
  const width = Number(params.get("w"));
  const height = Number(params.get("h"));
  const orientation = params.get("orientation");
  const zoom = Number(params.get("zoom"));

  if (presetId === "custom") {
    return customViewport(
      Number.isFinite(width) && width > 0 ? width : fallback.width,
      Number.isFinite(height) && height > 0 ? height : fallback.height,
      Number.isFinite(zoom) ? zoom : fallback.zoom,
    );
  }

  const preset = DEVICE_PRESETS.find((item) => item.id === presetId);
  if (!preset) return fallback;
  const state = viewportFromPreset(
    presetId,
    orientation === "landscape" ? "landscape" : "portrait",
  );
  return {
    ...state,
    zoom: Number.isFinite(zoom) ? clampZoom(zoom) : 100,
  };
}

export function validateViewport(
  width: number,
  nodeBounds: Array<{ id: string; x: number; width: number }>,
): ViewportDiagnostic[] {
  if (!Number.isFinite(width) || width <= 0) {
    return [{ severity: "error", code: "INVALID", message: "Viewport width must be greater than 0." }];
  }

  const overflow = nodeBounds
    .map((node) => ({
      ...node,
      right: node.x + node.width,
    }))
    .filter((node) => node.right > width)
    .sort((a, b) => b.right - a.right)[0];

  if (overflow) {
    return [{
      severity: "warning",
      code: "OVERFLOW",
      message: `${overflow.id} overflows the viewport by ${Math.ceil(overflow.right - width)}px.`,
    }];
  }

  return [{ severity: "ok", code: "BREAKPOINT", message: "Viewport is inside a valid responsive range." }];
}

export function categoryLabel(category: PreviewDeviceCategory): string {
  return category === "mobile" ? "iPhone" : category === "tablet" ? "Tablet" : category === "desktop" ? "Desktop" : "Custom";
}

export const ZOOM_PRESETS = [50, 75, 100, 125, 150] as const;
