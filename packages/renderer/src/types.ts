import type { TokenSet } from "@uiforge/design-tokens";
import type { ScreenId, UIDocument, UINode } from "@uiforge/ui-schema";
import type { CSSProperties, ReactNode } from "react";

export const RENDERER_VERSION = "uiforge.renderer/v1" as const;

export type ViewportPreset = "desktop" | "mobile";
export interface Viewport { width: number; height: number; preset: ViewportPreset; }

export interface FixtureData { values?: Record<string, string | number | boolean | null>; lists?: Record<string, Array<Record<string, string | number | boolean | null>>>; }

export interface RendererDiagnostic {
  code: "UNSUPPORTED_NODE" | "INVALID_PARENT" | "INVALID_CHILD" | "INVALID_TRANSITION" | "TOKEN_ERROR" | "RENDER_ERROR";
  severity: "warning" | "error";
  nodeId?: string;
  screenId?: string;
  message: string;
}

export interface RendererContext {
  document: UIDocument;
  tokens: TokenSet;
  viewport: Viewport;
  fixture?: FixtureData;
  diagnostics: RendererDiagnostic[];
}

export interface RendererComponentRegistry {
  [type: string]: (node: UINode, context: RendererContext) => ReactNode;
}

export interface RenderStyles {
  style?: CSSProperties;
  className?: string;
}

export interface PreviewState {
  activeScreenId: ScreenId;
  overlayNodeId?: string;
}
