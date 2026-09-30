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
    const tokenName = Object.values(next.semantic).find(
      (token) => token.semanticRole === role,
    )?.name;
    if (!tokenName) throw new Error(`No semantic token for color role: ${role}`);

    const token = next.semantic[tokenName]!;
    token.value = colors.light ?? colors.dark ?? token.value;
    token.theme = colors.dark ? "all" : "light";
  }

  return next;
}
