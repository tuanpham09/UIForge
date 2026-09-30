export type TokenValue = string | number;

export type TokenKind =
  | "color"
  | "spacing"
  | "typography"
  | "radius"
  | "shadow"
  | "border"
  | "breakpoint"
  | "motion";

export interface DesignToken<T extends TokenValue = TokenValue> {
  name: string;
  kind: TokenKind;
  value: T;
  description?: string;
  semanticRole?: string;
  primitiveRef?: string;
  theme?: "light" | "dark" | "all";
  themes?: Partial<Record<"light" | "dark", T>>;
}

export interface RawValueException {
  id: string;
  property: string;
  value: TokenValue;
  reason: string;
  approvedBy?: string;
  expiresAt?: string;
}

export interface TokenSet {
  version: "uiforge.tokens/v1";
  primitives: Record<string, DesignToken>;
  semantic: Record<string, DesignToken>;
  rawValueExceptions: RawValueException[];
}

export interface ColorStrategyInput {
  version: string;
  roles: Record<
    string,
    {
      light?: string;
      dark?: string;
      description?: string;
    }
  >;
  tonalScales?: Record<string, Record<string, string>>;
}

export interface TokenResolution {
  name: string;
  kind: TokenKind;
  value: TokenValue;
  cssVariable: string;
  theme?: "light" | "dark" | "all";
  themes?: Partial<Record<"light" | "dark", TokenValue>>;
}

export interface TokenValidationIssue {
  code:
    | "UNKNOWN_TOKEN"
    | "INVALID_TOKEN_REFERENCE"
    | "RAW_VALUE"
    | "EXPIRED_EXCEPTION"
    | "UNKNOWN_COLOR_ROLE";
  path: string;
  message: string;
}

export interface CSSVariableExport {
  css: string;
  variables: Record<string, string>;
}
