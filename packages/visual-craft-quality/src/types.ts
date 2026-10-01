// biome-ignore-all format: visual craft contract is maintained as semantic reference data
// biome-ignore-all assist/source/organizeImports: semantic package exports are intentionally grouped
export const VISUAL_CRAFT_VERSION = "uiforge.visual-craft/v1" as const;

export type Severity = "info" | "warning" | "error";
export type Viewport = "desktop" | "mobile";

export type TypeRole = "display" | "page-title" | "section-title" | "subsection-title" | "body" | "body-large" | "label" | "control" | "metric";
export type Density = "compact" | "standard" | "spacious";
export type CardPurpose = "grouping" | "summary" | "preview" | "selectable" | "interactive" | "media";
export type RadiusTier = "sm" | "md" | "lg" | "xl" | "full";
export type ElevationTier = "none" | "subtle" | "medium" | "strong";

export interface TypographyRole { role: TypeRole; fontSize: string; lineHeight: string; maxVisible?: boolean; }
export interface TypographyRamp { viewport: Viewport; roles: Record<TypeRole, TypographyRole>; maxVisibleSizes: number; }
export interface SpacingStrategy { base: 4; values: number[]; relationship: Record<string, number>; }
export interface DensityStrategy { card: Record<Density, number>; defaultByPurpose: Record<CardPurpose, Density>; }
export interface IconDefinition { id: string; provider: "lucide"; format: "svg"; family: "outline"; weight: "regular"; sizes: number[]; assetRef: string; }
export interface IconRegistry { version: "uiforge.icons/v1"; defaultProvider: "lucide"; icons: Record<string, IconDefinition>; }
export interface VisualCraftStrategy {
  version: typeof VISUAL_CRAFT_VERSION;
  typography: Record<Viewport, TypographyRamp>;
  spacing: SpacingStrategy;
  density: DensityStrategy;
  icons: { registryVersion: "uiforge.icons/v1"; defaultSizeByContext: Record<"informational"|"compact"|"control"|"navigation", number>; };
  radius: Record<RadiusTier, number | "pill-or-circle-only">;
  elevation: Record<ElevationTier, string>;
  containers: { desktopMaxWidth: number; desktopGutter: number; mobileGutter: number; readableTextMaxWidth: number };
  card: { allowedPurposes: CardPurpose[]; maxRepeatedAnatomyRatio: number; avoidCombination: string[] };
  responsive: { mobileTypeRamp: true; mobileCompactDensity: true; recomposeGrids: true; preserveReadableLineLength: true };
  decorationBudget: { maxAccentColors: number; maxDecorativeElementsWithoutPurpose: number };
}

export interface CraftNode {
  id: string; kind: "text"|"icon"|"card"|"container"|"control"|"decoration";
  typeRole?: TypeRole; fontSize?: string; lineHeight?: string; spacing?: number;
  iconId?: string; iconFormat?: string; iconFamily?: string; iconWeight?: string; iconSize?: number;
  cardPurpose?: CardPurpose; cardAnatomy?: string; radius?: number; radiusTier?: RadiusTier;
  elevation?: ElevationTier; shadow?: string; padding?: number; interactiveTarget?: number;
  semanticPurpose?: string; colorRole?: string; visibleOn?: Viewport | "all";
}

export interface CraftScreen {
  id: string; viewport: Viewport; nodes: CraftNode[]; visibleColors?: string[];
  repeatedCardCount?: number; totalCardCount?: number; appliedTypeRoles?: TypeRole[];
}

export interface CraftFinding {
  ruleId: string; severity: Severity; affectedIds: string[]; message: string; recommendation: string;
}
export interface LintResult { version: typeof VISUAL_CRAFT_VERSION; valid: boolean; findings: CraftFinding[]; fingerprint: string; }
