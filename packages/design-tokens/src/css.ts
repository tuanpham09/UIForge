import { resolveToken, toCssVariable } from "./resolve.js";
import type { CSSVariableExport, TokenSet } from "./types.js";

export function exportCSSVariables(set: TokenSet): CSSVariableExport {
  const names = [...Object.keys(set.primitives), ...Object.keys(set.semantic)].sort();
  const variables: Record<string, string> = {};
  const lines = [":root {"];
  for (const name of names) {
    const resolved = resolveToken(name, set);
    const value = String(resolved.value);
    const variable = toCssVariable(name);
    variables[variable] = value;
    lines.push(`  ${variable}: ${value};`);
  }
  lines.push("}");
  return { css: lines.join("\n"), variables };
}
