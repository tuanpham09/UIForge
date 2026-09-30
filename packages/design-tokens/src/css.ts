import { resolveToken, toCssVariable } from "./resolve.js";
import type { CSSVariableExport, TokenSet } from "./types.js";

export function exportCSSVariables(set: TokenSet): CSSVariableExport {
  const names = [...new Set([...Object.keys(set.primitives), ...Object.keys(set.semantic)])].sort();
  const variables: Record<string, string> = {};
  const lightLines = [":root {"];
  const darkLines = ["[data-theme=\"dark\"] {"];

  for (const name of names) {
    const resolved = resolveToken(name, set);
    const variable = toCssVariable(name);
    const value = String(resolved.value);
    variables[variable] = value;
    lightLines.push(`  ${variable}: ${value};`);
    const darkValue = resolved.themes?.dark;
    if (darkValue !== undefined) {
      darkLines.push(`  ${variable}: ${String(darkValue)};`);
    }
  }

  lightLines.push("}");
  const lines = [...lightLines];
  if (darkLines.length > 1) {
    darkLines.push("}");
    lines.push(...darkLines);
  }

  return { css: lines.join("\n"), variables };
}
