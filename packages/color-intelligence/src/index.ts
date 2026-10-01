// biome-ignore-all format: semantic contract is intentionally compact
// biome-ignore-all lint/correctness/noUnusedVariables: exported domain API is consumed downstream

export const COLOR_STRATEGY_VERSION = "uiforge.color-strategy/v1" as const;

export type ColorRole = {
  name: string;
  light: string;
  dark: string;
  description: string;
};

export type ColorStrategy = {
  version: typeof COLOR_STRATEGY_VERSION;
  primary: string;
  secondary: string;
  accent?: string;
  roles: ColorRole[];
  tonalScales: Record<string, Record<string, string>>;
  chart: string[];
  provenance: { source: string; designStrategyVersion: string };
  validation: string[];
};

function hex(value: string) {
  const normalized = value.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((x) => x + x)
          .join("")
      : normalized;
  return [0, 2, 4].map(
    (i) => parseInt(expanded.slice(i, i + 2), 16) / 255,
  );
}

function linear(value: number) {
  return value <= 0.03928
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

export function luminance(value: string) {
  const [r, g, b] = hex(value).map(linear);
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

export function contrast(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function mix(a: string, b: string, t: number) {
  const A = hex(a);
  const B = hex(b);
  return `#${A.map((x, i) =>
    Math.round((x + ((B[i] ?? 0) - x) * t) * 255)
      .toString(16)
      .padStart(2, "0"),
  ).join("")}`;
}

export function buildColorStrategy(input: {
  primary: string;
  secondary: string;
  accent?: string;
  domain: string;
  designStrategyVersion: string;
}): ColorStrategy {
  const white = "#ffffff";
  const black = "#111111";
  const scale = (seed: string) => ({
    100: mix(white, seed, 0.08),
    200: mix(white, seed, 0.16),
    300: mix(white, seed, 0.28),
    400: mix(white, seed, 0.45),
    500: seed,
    600: mix(seed, black, 0.12),
    700: mix(seed, black, 0.28),
    800: mix(seed, black, 0.45),
    900: mix(seed, black, 0.65),
  });

  const roles: ColorRole[] = [
    { name: "primary", light: input.primary, dark: mix(input.primary, white, 0.18), description: "primary brand anchor" },
    { name: "secondary", light: input.secondary, dark: mix(input.secondary, white, 0.18), description: "secondary brand anchor" },
    { name: "surface", light: "#ffffff", dark: "#171717", description: "large content surface" },
    { name: "foreground", light: "#111111", dark: "#f5f5f5", description: "primary text" },
    { name: "border", light: "#d4d4d4", dark: "#404040", description: "component boundary" },
    { name: "success", light: "#15803d", dark: "#4ade80", description: "success status" },
    { name: "warning", light: "#a16207", dark: "#facc15", description: "warning status" },
    { name: "error", light: "#b91c1c", dark: "#f87171", description: "error status" },
    { name: "info", light: "#0369a1", dark: "#38bdf8", description: "informational status" },
  ];

  if (input.accent) {
    roles.push({
      name: "accent",
      light: input.accent,
      dark: mix(input.accent, white, 0.18),
      description: "optional purposeful accent",
    });
  }

  const strategy: ColorStrategy = {
    version: COLOR_STRATEGY_VERSION,
    primary: input.primary,
    secondary: input.secondary,
    accent: input.accent,
    roles,
    tonalScales: {
      primary: scale(input.primary),
      secondary: scale(input.secondary),
    },
    chart: ["#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#9333ea"],
    provenance: {
      source: input.domain,
      designStrategyVersion: input.designStrategyVersion,
    },
    validation: [],
  };

  strategy.validation = validateColorStrategy(strategy);
  return strategy;
}

export function validateColorStrategy(strategy: ColorStrategy): string[] {
  const issues: string[] = [];

  if (!strategy.primary || !strategy.secondary) {
    issues.push("MISSING_BRAND_ANCHOR");
  }

  if (
    strategy.accent &&
    !strategy.roles.some((role) => role.name === "accent")
  ) {
    issues.push("INVALID_ACCENT_ROLE");
  }

  const foreground = strategy.roles.find(
    (role) => role.name === "foreground",
  )?.light;
  const surface = strategy.roles.find((role) => role.name === "surface")?.light;

  if (foreground && surface && contrast(foreground, surface) < 4.5) {
    issues.push("INSUFFICIENT_TEXT_CONTRAST");
  }

  if (
    new Set(strategy.roles.map((role) => role.name)).size !==
    strategy.roles.length
  ) {
    issues.push("DUPLICATE_ROLE");
  }

  return issues;
}

export function deterministicColorHash(strategy: ColorStrategy) {
  return JSON.stringify(strategy);
}
