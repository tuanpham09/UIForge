import type { CodeSpecification, ComponentRequirement, FilePlanEntry } from "./types";

export type GeneratedFile = { path: string; content: string; owner: "generated" | "preserved" | "review-required"; kind: FilePlanEntry["kind"] };
export type GenerationResult = { files: GeneratedFile[]; manifest: { version: "uiforge.generated-files/v1"; specVersion: string; deterministicKey: string; files: Array<{ path: string; owner: GeneratedFile["owner"]; kind: GeneratedFile["kind"]; content: string }> } };

const quote = (value: unknown) => JSON.stringify(value);
const escapeText = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", " ");

function componentSource(item: ComponentRequirement | undefined, content: string, accessibility?: { role?: string; accessibleName?: string }): string {
  const a11y = accessibility?.accessibleName ? " aria-label={" + quote(accessibility.accessibleName) + "}" : "";
  const role = accessibility?.role ? " role={" + quote(accessibility.role) + "}" : "";
  if (!item?.componentName || !item.importPath) return "<div data-uiforge-node" + a11y + role + ">" + content + "</div>";
  const props = Object.entries(item.props).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => " " + key + "={" + quote(value) + "}").join("");
  const variant = item.variant ? " data-variant={" + quote(item.variant) + "}" : "";
  return "<" + item.componentName + props + variant + a11y + role + ">" + content + "</" + item.componentName + ">";
}

function pageForScreen(spec: CodeSpecification, screenId: string, path: string): string {
  const imports = spec.importPlan.filter((item) => item.imports.length > 0).map((item) => "import { " + item.imports.join(", ") + " } from " + quote(item.source) + ";").join("\n");
  const nodes = spec.componentGraph.filter((item) => item.screenId === screenId).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  const body = nodes.map((item) => {
    const a11y = spec.accessibilityRequirements.find((req) => req.nodeId === item.nodeId);
    const responsive = spec.responsiveRequirements.filter((req) => req.nodeId === item.nodeId).flatMap((req) => req.classes).sort().join(" ");
    const rendered = componentSource(item, item.props.children == null ? "" : escapeText(String(item.props.children)), a11y ? { role: a11y.role, accessibleName: a11y.accessibleName } : undefined);
    return responsive ? rendered.replace(">", " data-responsive-classes=" + quote(responsive) + ">") : rendered;
  }).join("\n      ");
  return [
    "\"use client\";",
    imports,
    "",
    "export default function Page() {",
    "  return (",
    "    <main data-uiforge-screen=" + quote(screenId) + " data-uiforge-route=" + quote(path) + " className=\"min-h-screen\">",
    "      <section className=\"mx-auto flex w-full max-w-7xl flex-col gap-6 p-6\">",
    "      " + body,
    "      </section>",
    "    </main>",
    "  );",
    "}",
    ""
  ].join("\n");
}

function globals(spec: CodeSpecification): string {
  const vars = spec.tokenRequirements.map((item) => "  " + item.cssVariable + ": var(" + item.cssVariable + ");").filter((item, index, all) => all.indexOf(item) === index).sort();
  return ["@import \"tailwindcss\";", "", ":root {", ...vars, "}", ""].join("\n");
}

export function generateReactCode(spec: CodeSpecification): GenerationResult {
  const files: GeneratedFile[] = [];
  for (const entry of [...spec.filePlan].sort((a, b) => a.path.localeCompare(b.path))) {
    let content = "";
    if (entry.kind === "layout") content = 'import type { ReactNode } from "react";\nimport "./globals.css";\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}\n';
    if (entry.kind === "style") content = globals(spec);
    if (entry.kind === "page" && entry.screenIds[0]) {
      const route = entry.path.replace(/^app/, "").replace(/\/page\.tsx$/, "") || "/";
      content = pageForScreen(spec, entry.screenIds[0], route);
    }
    files.push({ path: entry.path, content, owner: entry.owner, kind: entry.kind });
  }
  return { files, manifest: { version: "uiforge.generated-files/v1", specVersion: spec.version, deterministicKey: spec.deterministicKey, files: files.map((file) => ({ path: file.path, owner: file.owner, kind: file.kind, content: file.content })) } };
}