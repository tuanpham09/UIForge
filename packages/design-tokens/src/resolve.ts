import type { DesignToken, TokenResolution, TokenSet } from "./types.js";

const referencePattern = /^\{([^}]+)\}$/;

export class UnknownTokenError extends Error {
  constructor(public readonly tokenName: string) {
    super(`Unknown design token: ${tokenName}`);
    this.name = "UnknownTokenError";
  }
}

function lookupToken(name: string, set: TokenSet): DesignToken | undefined {
  return set.semantic[name] ?? set.primitives[name];
}

export function resolveToken(name: string, set: TokenSet): TokenResolution {
  const token = lookupToken(name, set);
  if (!token) throw new UnknownTokenError(name);

  const resolveValue = (value: string | number, seen: Set<string>): string | number => {
    if (typeof value !== "string") return value;
    const match = referencePattern.exec(value);
    if (!match) return value;
    const ref = match[1]!;
    if (seen.has(ref)) throw new Error(`Circular token reference: ${ref}`);
    const target = lookupToken(ref, set);
    if (!target) throw new UnknownTokenError(ref);
    return resolveValue(target.value, new Set([...seen, ref]));
  };

  const value = resolveValue(token.value, new Set([name]));
  const themes = token.themes
    ? Object.fromEntries(
        Object.entries(token.themes).map(([theme, themeValue]) => [
          theme,
          resolveValue(themeValue!, new Set([name])),
        ]),
      )
    : undefined;
  return {
    name,
    kind: token.kind,
    value,
    cssVariable: toCssVariable(name),
    theme: token.theme,
    ...(themes ? { themes } : {}),
  };
}

export function toCssVariable(name: string): string {
  return `--ui-${name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}`;
}
