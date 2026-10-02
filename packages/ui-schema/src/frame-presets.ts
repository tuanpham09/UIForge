import type { Frame, FrameId } from "./types";

export const FRAME_PRESET_REGISTRY_VERSION = "uiforge.frame-presets/v1" as const;
export type FramePresetCategory = "mobile" | "tablet" | "android" | "desktop";

export interface FramePreset {
  id: string;
  name: string;
  category: FramePresetCategory;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  safeArea?: { top: number; right: number; bottom: number; left: number };
  device?: { family: string; model?: string };
  version: typeof FRAME_PRESET_REGISTRY_VERSION;
}

const preset = (
  id: string,
  name: string,
  category: FramePresetCategory,
  width: number,
  height: number,
  device?: FramePreset["device"],
): FramePreset => ({
  id, name, category, width, height,
  orientation: width <= height ? "portrait" : "landscape",
  device, version: FRAME_PRESET_REGISTRY_VERSION,
});

export const FRAME_PRESETS: readonly FramePreset[] = [
  preset("iphone-12", "iPhone 12 / 12 Pro", "mobile", 390, 844, { family: "iPhone", model: "12 / 12 Pro" }),
  preset("iphone-13", "iPhone 13 / 13 Pro", "mobile", 390, 844, { family: "iPhone", model: "13 / 13 Pro" }),
  preset("iphone-14", "iPhone 14 / 14 Pro", "mobile", 393, 852, { family: "iPhone", model: "14 / 14 Pro" }),
  preset("iphone-15", "iPhone 15 / 15 Pro", "mobile", 393, 852, { family: "iPhone", model: "15 / 15 Pro" }),
  preset("iphone-16", "iPhone 16 / 16 Pro", "mobile", 402, 874, { family: "iPhone", model: "16 / 16 Pro" }),
  preset("iphone-17", "iPhone 17 / 17 Pro", "mobile", 402, 874, { family: "iPhone", model: "17 / 17 Pro" }),
  preset("iphone-18", "iPhone 18 / 18 Pro", "mobile", 402, 874, { family: "iPhone", model: "18 / 18 Pro" }),
  preset("ipad-portrait", "iPad Portrait", "tablet", 820, 1180, { family: "iPad" }),
  preset("ipad-landscape", "iPad Landscape", "tablet", 1180, 820, { family: "iPad" }),
  preset("android-phone", "Android Phone", "android", 412, 915, { family: "Android" }),
  preset("android-tablet", "Android Tablet", "android", 800, 1280, { family: "Android" }),
  preset("desktop-1280", "Desktop 1280", "desktop", 1280, 800, { family: "Desktop" }),
  preset("desktop-1440", "Desktop 1440", "desktop", 1440, 900, { family: "Desktop" }),
  preset("desktop-1920", "Desktop 1920", "desktop", 1920, 1080, { family: "Desktop" }),
];

export const getFramePreset = (id: string): FramePreset | undefined =>
  FRAME_PRESETS.find((item) => item.id === id);

export const createFrameFromPreset = (
  id: FrameId,
  screenId: string,
  presetId: string,
  x = 0,
  y = 0,
): Frame => {
  const selected = getFramePreset(presetId);
  if (!selected) throw new Error(`unknown frame preset: ${presetId}`);
  return {
    id, screenId: screenId as Frame["screenId"], presetId: selected.id,
    name: selected.name, x, y, width: selected.width, height: selected.height,
    orientation: selected.orientation, presetVersion: selected.version,
  };
};
