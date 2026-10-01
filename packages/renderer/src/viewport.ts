import type { Viewport, ViewportPreset } from "./types";

export const VIEWPORTS: Record<ViewportPreset, Viewport> = {
  mobile: { preset: "mobile", width: 390, height: 844 },
  tablet: { preset: "tablet", width: 768, height: 1024 },
  desktop: { preset: "desktop", width: 1024, height: 768 },
  wide: { preset: "wide", width: 1440, height: 900 },
};

export function getViewport(preset: ViewportPreset): Viewport {
  return VIEWPORTS[preset];
}
