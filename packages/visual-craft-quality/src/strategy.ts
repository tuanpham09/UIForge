// biome-ignore-all format: visual craft contract is maintained as semantic reference data
// biome-ignore-all assist/source/organizeImports: semantic package exports are intentionally grouped
import type { VisualCraftStrategy } from "./types";

const role = (roleName: Parameters<typeof Object>[0] extends never ? never : string, size: string, lineHeight: string) =>
  ({ role: roleName as never, fontSize: size, lineHeight });

const desktop = {
  display: role("display","36px","44px"), "page-title": role("page-title","32px","40px"),
  "section-title": role("section-title","24px","32px"), "subsection-title": role("subsection-title","20px","28px"),
  body: role("body","14px","20px"), "body-large": role("body-large","16px","24px"),
  label: role("label","12px","16px"), control: role("control","14px","20px"), metric: role("metric","28px","36px")
};
const mobile = {
  display: role("display","30px","38px"), "page-title": role("page-title","28px","36px"),
  "section-title": role("section-title","22px","28px"), "subsection-title": role("subsection-title","18px","24px"),
  body: role("body","14px","20px"), "body-large": role("body-large","16px","24px"),
  label: role("label","12px","16px"), control: role("control","14px","20px"), metric: role("metric","24px","32px")
};

export const defaultVisualCraftStrategy: VisualCraftStrategy = {
  version: "uiforge.visual-craft/v1",
  typography: {
    desktop: { viewport: "desktop", roles: desktop, maxVisibleSizes: 5 },
    mobile: { viewport: "mobile", roles: mobile, maxVisibleSizes: 5 }
  },
  spacing: {
    base: 4,
    values: [4,8,12,16,20,24,32,40,48,64],
    relationship: { "icon-label": 8, "title-description": 8, "content-action": 16, "section-section": 32, "page-gutter": 24 }
  },
  density: {
    card: { compact: 12, standard: 16, spacious: 24 },
    defaultByPurpose: { grouping: "standard", summary: "compact", preview: "standard", selectable: "compact", interactive: "compact", media: "standard" }
  },
  icons: {
    registryVersion: "uiforge.icons/v1",
    defaultSizeByContext: { informational: 12, compact: 16, control: 20, navigation: 24 }
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, full: "pill-or-circle-only" },
  elevation: { none: "none", subtle: "0 1px 2px", medium: "0 4px 12px", strong: "0 12px 32px" },
  containers: { desktopMaxWidth: 1200, desktopGutter: 32, mobileGutter: 16, readableTextMaxWidth: 720 },
  card: {
    allowedPurposes: ["grouping","summary","preview","selectable","interactive","media"],
    maxRepeatedAnatomyRatio: 0.6,
    avoidCombination: ["large-radius+strong-shadow+tinted-background+thick-border"]
  },
  responsive: { mobileTypeRamp: true, mobileCompactDensity: true, recomposeGrids: true, preserveReadableLineLength: true },
  decorationBudget: { maxAccentColors: 3, maxDecorativeElementsWithoutPurpose: 0 }
};
