import type { Viewport, ViewportPreset } from "./types";

export const VIEWPORTS: Record<ViewportPreset, Viewport> = {
  desktop: {
    preset: "desktop",
    width: 1440,
    height: 900,
  },
  mobile: {
    preset: "mobile",
    width: 390,
    height: 844,
  },
};

export function getViewport(preset: ViewportPreset): Viewport {
  return VIEWPORTS[preset];
}
