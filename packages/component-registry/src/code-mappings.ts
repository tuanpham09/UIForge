import type {
  CodeComponentMapping,
  CodeMappingQuery,
  CodeMappingResolution,
  CodeMappingSet,
  ComponentId,
} from "./types";

const SHADCN_BASE_URL = "https://ui.shadcn.com/docs/components";

const mappings: CodeComponentMapping[] = [
  {
    mappingId: "uiforge.button/react-nextjs/shadcn-ui",
    version: "uiforge.code-mapping/v1",
    framework: "react",
    runtime: "nextjs",
    styling: "tailwind-v4",
    library: "shadcn-ui",
    importPath: "components/ui/button",
    importPathKind: "project-relative",
    exportName: "Button",
    componentName: "Button",
    propMapping: {
      disabled: "disabled",
      children: "children",
      "aria-label": "aria-label",
    },
    variantMapping: {
      primary: "default",
      secondary: "secondary",
      destructive: "destructive",
      ghost: "ghost",
    },
    tokenMapping: {
      "color.primary": "button.default",
      "color.onPrimary": "button.default.foreground",
      "control.radius": "radius",
    },
    dependencies: ["shadcn-ui", "tailwindcss"],
    versionRange: "current",
    sourceLocation: {
      kind: "upstream",
      path: "components/base/button",
      url: `${SHADCN_BASE_URL}/base/button`,
    },
    confidence: "high",
    provenance: {
      kind: "verified-reference",
      source: "shadcn/ui official Button documentation",
      verifiedAt: "2026-10-01",
      notes:
        "Stores the upstream component path rather than a consumer alias such as @/components/ui/button.",
    },
  },
  {
    mappingId: "uiforge.card/react-nextjs/shadcn-ui",
    version: "uiforge.code-mapping/v1",
    framework: "react",
    runtime: "nextjs",
    styling: "tailwind-v4",
    library: "shadcn-ui",
    importPath: "components/ui/card",
    importPathKind: "project-relative",
    exportName: "Card",
    componentName: "Card",
    propMapping: {
      children: "children",
      className: "className",
    },
    variantMapping: {
      default: "default",
      interactive: "default",
    },
    tokenMapping: {
      "color.surface": "card.background",
      "color.border": "card.border",
      "control.radius": "radius",
      "shadow.subtle": "shadow-sm",
    },
    dependencies: ["shadcn-ui", "tailwindcss"],
    versionRange: "current",
    sourceLocation: {
      kind: "upstream",
      path: "components/base/card",
      url: `${SHADCN_BASE_URL}/base/card`,
    },
    confidence: "high",
    provenance: {
      kind: "verified-reference",
      source: "shadcn/ui official Card documentation",
      verifiedAt: "2026-10-01",
    },
  },
  {
    mappingId: "uiforge.input/react-nextjs/shadcn-ui",
    version: "uiforge.code-mapping/v1",
    framework: "react",
    runtime: "nextjs",
    styling: "tailwind-v4",
    library: "shadcn-ui",
    importPath: "components/ui/input",
    importPathKind: "project-relative",
    exportName: "Input",
    componentName: "Input",
    propMapping: {
      disabled: "disabled",
      value: "value",
      placeholder: "placeholder",
      required: "required",
      "aria-label": "aria-label",
    },
    variantMapping: {
      default: "default",
      search: "default",
    },
    tokenMapping: {
      "color.foreground": "input.foreground",
      "color.surface": "input.background",
      "color.border": "input.border",
      "control.radius": "radius",
    },
    dependencies: ["shadcn-ui", "tailwindcss"],
    versionRange: "current",
    sourceLocation: {
      kind: "upstream",
      path: "components/base/input",
      url: `${SHADCN_BASE_URL}/base/input`,
    },
    confidence: "high",
    provenance: {
      kind: "verified-reference",
      source: "shadcn/ui official Input documentation",
      verifiedAt: "2026-10-01",
    },
  },
];

export const codeMappingSet: CodeMappingSet = {
  version: "uiforge.code-mapping/v1",
  mappings: Object.fromEntries(
    mappings.map((mapping) => [mapping.mappingId, mapping]),
  ),
};

export function queryCodeMappings(
  query: CodeMappingQuery,
): CodeMappingResolution[] {
  const results = Object.values(codeMappingSet.mappings).filter(
    (mapping) =>
      mapping.mappingId.startsWith(`${query.componentId}/`) &&
      (!query.framework || mapping.framework === query.framework) &&
      (!query.runtime || mapping.runtime === query.runtime) &&
      (!query.library || mapping.library === query.library),
  );

  return results.length > 0
    ? results.map((mapping) => ({
        componentId: query.componentId,
        mapping,
        reason: "resolved" as const,
      }))
    : [
        {
          componentId: query.componentId,
          mapping: null,
          reason:
            query.framework || query.runtime || query.library
              ? "unsupported-target"
              : "missing",
        },
      ];
}

export function resolveCodeMapping(
  componentId: ComponentId,
  target: Omit<CodeMappingQuery, "componentId"> = {},
): CodeMappingResolution {
  return (
    queryCodeMappings({ componentId, ...target })[0] ?? {
      componentId,
      mapping: null,
      reason: "missing",
    }
  );
}
