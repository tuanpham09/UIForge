import type { CodeSpecification, ComponentRequirement, FilePlanEntry } from "./types";

export type GeneratedFile = {
  path: string;
  content: string;
  owner: "generated" | "preserved" | "review-required";
  kind: FilePlanEntry["kind"];
};

export type GenerationResult = {
  files: GeneratedFile[];
  manifest: {
    version: "uiforge.generated-files/v1";
    specVersion: string;
    deterministicKey: string;
    files: Array<{ path: string; owner: GeneratedFile["owner"]; kind: GeneratedFile["kind"]; content: string }>;
  };
};

const quote = (value: unknown) => JSON.stringify(value);

function componentSource(
  item: ComponentRequirement | undefined,
  content: string,
  accessibility?: { role?: string; accessibleName?: string },
  className = "",
): string {
  const a11y = accessibility?.accessibleName ? " aria-label=" + quote(accessibility.accessibleName) : "";
  const role = accessibility?.role ? " role=" + quote(accessibility.role) : "";
  const classes = className ? " className=" + quote(className) : "";
  if (!item?.componentName || !item.importPath) {
    return "<div data-uiforge-node" + a11y + role + classes + ">" + content + "</div>";
  }

  const props = Object.entries(item.props)
    .filter(([key]) => key !== "children")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => " " + key + "=" + quote(value))
    .join("");
  const variant = item.variant ? " variant=" + quote(item.variant) : "";
  return "<" + item.componentName + props + variant + a11y + role + classes + ">" + content + "</" + item.componentName + ">";
}

function pageForScreen(spec: CodeSpecification, screenId: string, path: string): string {
  const imports = spec.importPlan
    .filter((item) => item.imports.length > 0)
    .sort((a, b) => a.source.localeCompare(b.source))
    .map((item) => "import { " + [...item.imports].sort().join(", ") + " } from " + quote(item.source) + ";")
    .join("\n");

  const nodes = spec.componentGraph
    .filter((item) => item.screenId === screenId)
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId));

  const body = nodes
    .map((item) => {
      const a11y = spec.accessibilityRequirements.find((req) => req.nodeId === item.nodeId);
      const responsive = spec.responsiveRequirements
        .filter((req) => req.nodeId === item.nodeId)
        .sort((a, b) => a.breakpoint.localeCompare(b.breakpoint))
        .flatMap((req) => req.classes)
        .filter(Boolean);
      const tokenClasses = spec.tokenRequirements
        .filter((req) => req.nodeId === item.nodeId)
        .map((req) => req.tailwindValue)
        .filter(Boolean);
      const classes = [...new Set([...responsive, ...tokenClasses])].sort().join(" ");
      const children = item.props.children == null ? "" : String(item.props.children);
      return componentSource(item, children, a11y ? { role: a11y.role, accessibleName: a11y.accessibleName } : undefined, classes);
    })
    .join("\n      ");

  return [
    '"use client";',
    imports,
    "",
    "export default function Page() {",
    "  return (",
    '    <main data-uiforge-screen=' + quote(screenId) + ' data-uiforge-route=' + quote(path) + ' className="min-h-screen">',
    '      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">',
    "      " + body,
    "      </section>",
    "    </main>",
    "  );",
    "}",
    "",
  ].join("\n");
}

function globals(spec: CodeSpecification): string {
  const vars = spec.tokenRequirements
    .map((item) => "  " + item.cssVariable + ": " + item.tailwindValue + ";")
    .filter((item, index, all) => all.indexOf(item) === index)
    .sort();
  return ['@import "tailwindcss";', "", ":root {", ...vars, "}", ""].join("\n");
}

export function generateReactCode(spec: CodeSpecification): GenerationResult {
  const files: GeneratedFile[] = [];

  for (const entry of [...spec.filePlan].sort((a, b) => a.path.localeCompare(b.path))) {
    let content = "";
    if (entry.kind === "layout") {
      content = [
        'import type { ReactNode } from "react";',
        'import "./globals.css";',
        "",
        "export default function RootLayout({ children }: { children: ReactNode }) {",
        '  return <html lang="en"><body>{children}</body></html>;',
        "}",
        "",
      ].join("\n");
    }
    if (entry.kind === "style") content = globals(spec);
    if (entry.kind === "page" && entry.screenIds[0]) {
      const route = entry.path.replace(/^app/, "").replace(/\/page\.tsx$/, "") || "/";
      content = pageForScreen(spec, entry.screenIds[0], route);
    }
    files.push({ path: entry.path, content, owner: entry.owner, kind: entry.kind });
  }

  return {
    files,
    manifest: {
      version: "uiforge.generated-files/v1",
      specVersion: spec.version,
      deterministicKey: spec.deterministicKey,
      files: files.map((file) => ({ path: file.path, owner: file.owner, kind: file.kind, content: file.content })),
    },
  };
}
