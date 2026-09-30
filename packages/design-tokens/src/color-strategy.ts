import type { TokenSet, ColorStrategyInput } from "./types.js";

export function applyColorStrategy(
  base: TokenSet,
  strategy: ColorStrategyInput,
): TokenSet {
  const next: TokenSet = structuredClone(base);
  const supportedRoles = new Set(
    Object.values(next.semantic)
      .map((token) => token.semanticRole)
      .filter((role): role is string => Boolean(role)),
  );

  for (const [role, colors] of Object.entries(strategy.roles)) {
    if (!supportedRoles.has(role)) {
      throw new Error(`Unknown Color Strategy role: ${role}`);
    }

    const token = Object.values(next.semantic).find(
      (candidate) => candidate.semanticRole === role,
    );
    if (!token) throw new Error(`No semantic token for color role: ${role}`);

    if (colors.light !== undefined) token.value = colors.light;
    if (colors.dark !== undefined) {
      token.themes = { ...(token.themes ?? {}), dark: colors.dark };
    }
    token.theme = colors.dark ? "all" : "light";
  }

  return next;
}
