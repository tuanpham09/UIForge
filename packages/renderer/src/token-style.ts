import { resolveToken, type TokenSet } from "@uiforge/design-tokens";
import type { CSSProperties } from "react";
import type { RendererDiagnostic } from "./types";

export function tokenValue(name: string | undefined, tokens: TokenSet, diagnostics: RendererDiagnostic[], nodeId?: string): string | number | undefined {
  if (!name) return undefined;
  try { return resolveToken(name, tokens).value; }
  catch (error) {
    diagnostics.push({ code: "TOKEN_ERROR", severity: "error", nodeId, message: error instanceof Error ? error.message : `Unable to resolve token ${name}` });
    return undefined;
  }
}

export function tokenStyles(tokens: Record<string, string> | undefined, set: TokenSet, diagnostics: RendererDiagnostic[], nodeId?: string): CSSProperties {
  const style: CSSProperties = {};
  for (const [slot, ref] of Object.entries(tokens ?? {})) {
    const value = tokenValue(ref, set, diagnostics, nodeId);
    if (slot === "color" && value !== undefined) style.color = String(value);
    if (slot === "background" && value !== undefined) style.backgroundColor = String(value);
    if (slot === "border" && value !== undefined) style.borderColor = String(value);
    if (slot === "gap" && value !== undefined) style.gap = String(value);
    if (slot === "padding" && value !== undefined) style.padding = String(value);
    if (slot === "radius" && value !== undefined) style.borderRadius = String(value);
  }
  return style;
}
