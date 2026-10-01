
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { describe, expect, it } from "vitest";
import { sampleProject } from "../src/sample-project";
import {
  createHttpHandler,
  createMcpServer,
  validateProject,
} from "../src/server";
import type { ProjectProvider } from "../src/types";

const evidenceDir = "artifacts/mcp";
mkdirSync(evidenceDir, { recursive: true });

const expectedTools = [
  "get_project",
  "get_screen",
  "get_layout_tree",
  "get_component",
  "get_component_registry",
  "get_design_tokens",
  "get_code_mapping",
  "get_responsive_rules",
  "get_code_spec",
  "get_flows",
  "get_flow",
  "get_user_journey",
  "get_transitions",
  "get_screen_connections",
  "get_navigation_map",
  "validate_design",
  "validate_flow",
];

function modernClient() {
  return new Client(
    { name: "uiforge-contract-test", version: "0.1.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
}

describe("UIForge MCP contract", () => {
  it("registers every read tool with a schema and read-only annotation", async () => {
    const client = modernClient();
    const transport = new StreamableHTTPClientTransport(
      new URL("http://uiforge.test/mcp"),
      {
        fetch: async (url, init) =>
          createHttpHandler().fetch(new Request(url, init)),
      },
    );
    await client.connect(transport);

    const result = await client.listTools();
    expect(result.tools.map((tool) => tool.name)).toEqual(expectedTools);
    expect(result.tools).toHaveLength(expectedTools.length);
    writeFileSync(
      evidenceDir + "/tool-schema-artifact.json",
      JSON.stringify({ tools: result.tools }, null, 2),
    );
    for (const tool of result.tools) {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.destructiveHint).toBe(false);
    }

    await client.close();
  });

  it("advertises semantic resources and templates", async () => {
    const client = modernClient();
    const transport = new StreamableHTTPClientTransport(
      new URL("http://uiforge.test/mcp"),
      {
        fetch: async (url, init) =>
          createHttpHandler().fetch(new Request(url, init)),
      },
    );
    await client.connect(transport);

    const resources = await client.listResources();
    const templates = await client.listResourceTemplates();
    expect(resources.resources.map((item) => item.uri)).toContain(
      "uiforge://projects/sample-project",
    );
    expect(templates.resourceTemplates).toHaveLength(9);

    const project = await client.readResource({
      uri: "uiforge://projects/sample-project",
    });
    expect(project.contents[0]).toBeDefined();
    const projectContent = project.contents[0];\n    expect(projectContent && "text" in projectContent ? projectContent.text : "").toContain("uiforge.mcp/v1");

    await client.close();
  });

  it("reads a complete flow without unrelated screen payloads", async () => {
    const client = modernClient();
    const transport = new StreamableHTTPClientTransport(
      new URL("http://uiforge.test/mcp"),
      {
        fetch: async (url, init) =>
          createHttpHandler().fetch(new Request(url, init)),
      },
    );
    await client.connect(transport);

    const result = await client.callTool({
      name: "get_flow",
      arguments: {
        projectId: "sample-project",
        flowId: "flow.authenticated-details",
      },
    });
    expect(result.isError).not.toBe(true);
    const body = result.structuredContent as {
      data: { transitions: unknown[] };
      revision: number;
    };
    expect(body.revision).toBe(7);
    expect(body.data.transitions).toHaveLength(1);
    const contextBytes = Buffer.byteLength(JSON.stringify(body), "utf8");
    expect(contextBytes).toBeLessThan(12000);
    writeFileSync(
      evidenceDir + "/mcp-transcript.json",
      JSON.stringify({ tool: "get_flow", result: body, contextBytes }, null, 2),
    );
    writeFileSync(
      evidenceDir + "/context-size-benchmark.json",
      JSON.stringify(
        { maxBytes: 12000, measuredBytes: contextBytes, status: "pass" },
        null,
        2,
      ),
    );

    await client.close();
  });

  it("rejects malformed project input through the tool schema", async () => {
    const client = modernClient();
    const transport = new StreamableHTTPClientTransport(
      new URL("http://uiforge.test/mcp"),
      {
        fetch: async (url, init) =>
          createHttpHandler().fetch(new Request(url, init)),
      },
    );
    await client.connect(transport);

    const result = await client.callTool({
      name: "get_project",
      arguments: {},
    });
    expect(result.isError).toBe(true);

    await client.close();
  });

  it("returns structured findings for broken flow references", async () => {
    const broken = structuredClone(sampleProject);
    const firstFlow = broken.flows[0];\n    const firstTransition = firstFlow?.transitions[0];\n    if (!firstTransition) throw new Error("Sample flow fixture is missing a transition.");\n    firstTransition.destination.screenId = "screen.missing";
    const provider: ProjectProvider = {
      getProject: (projectId) =>
        projectId === broken.projectId ? broken : null,
    };

    const client = modernClient();
    const transport = new StreamableHTTPClientTransport(
      new URL("http://uiforge.test/mcp"),
      {
        fetch: async (url, init) =>
          createHttpHandler(provider).fetch(new Request(url, init)),
      },
    );
    await client.connect(transport);

    const result = await client.callTool({
      name: "validate_flow",
      arguments: {
        projectId: "sample-project",
        flowId: "flow.authenticated-details",
      },
    });
    const body = result.structuredContent as {
      data: { valid: boolean; findings: Array<{ code: string }> };
    };
    expect(body.data.valid).toBe(false);
    expect(
      body.data.findings.some(
        (finding) => finding.code === "MISSING_DESTINATION_SCREEN",
      ),
    ).toBe(true);

    await client.close();
  });

  it("connects over local stdio", async () => {
    const client = modernClient();
    const transport = new StdioClientTransport({
      command: "pnpm",
      args: ["exec", "tsx", "apps/mcp-server/src/stdio.ts"],
      cwd: process.cwd(),
      stderr: "pipe",
    });
    await client.connect(transport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(expectedTools);

    const result = await client.callTool({
      name: "get_project",
      arguments: { projectId: "sample-project" },
    });
    expect(result.isError).not.toBe(true);

    await client.close();
  });

  it("connects through a real local Streamable HTTP process", async () => {
    const child = spawn(
      "pnpm",
      ["exec", "tsx", "apps/mcp-server/src/http.ts"],
      {
        cwd: process.cwd(),
        env: { ...process.env, PORT: "3123" },
        stdio: ["ignore", "ignore", "pipe"],
      },
    );

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(new Error("MCP HTTP server did not start within 5 seconds")),
        5000,
      );
      child.stderr?.on("data", (chunk) => {
        if (String(chunk).includes("UIForge MCP HTTP listening")) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.on("exit", (code) => {
        if (code !== null && code !== 0) {
          clearTimeout(timer);
          reject(new Error("MCP HTTP process exited with code " + code));
        }
      });
    });

    const client = modernClient();
    const transport = new StreamableHTTPClientTransport(
      new URL("http://127.0.0.1:3123/mcp"),
    );
    await client.connect(transport);
    const result = await client.callTool({
      name: "get_project",
      arguments: { projectId: "sample-project" },
    });
    expect(result.isError).not.toBe(true);
    await client.close();
    child.kill("SIGTERM");
  });

  it("validates the deterministic sample project", () => {
    const report = validateProject(sampleProject);
    expect(report.valid).toBe(true);
    expect(report.findings).toEqual([]);
  });

  it("does not expose write tools", async () => {
    const server = createMcpServer();
    const client = modernClient();
    const transport = new StreamableHTTPClientTransport(
      new URL("http://uiforge.test/mcp"),
      {
        fetch: async (url, init) =>
          createHttpHandler().fetch(new Request(url, init)),
      },
    );
    await client.connect(transport);
    const result = await client.listTools();
    expect(
      result.tools.some(
        (tool) =>
          tool.name.startsWith("create_") ||
          tool.name.startsWith("update_") ||
          tool.name.startsWith("delete_"),
      ),
    ).toBe(false);
    await client.close();
    await server.close();
  });
});
[36;1mpnpm typecheck[0m
shell: /usr/bin/bash -e {0}
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
$ turbo typecheck

Attention:
Turborepo now collects completely anonymous telemetry regarding usage.
This information is used to shape the Turborepo roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://turborepo.dev/docs/telemetry


   • Packages in scope: @uiforge/ai, @uiforge/color-intelligence, @uiforge/component-intelligence, @uiforge/component-registry, @uiforge/design-intelligence, @uiforge/design-tokens, @uiforge/editor, @uiforge/mcp-server, @uiforge/renderer, @uiforge/screenshot-to-ui, @uiforge/shared, @uiforge/text-to-ui, @uiforge/ui-schema, @uiforge/visual-craft-quality, @uiforge/web
   • Running typecheck in 15 packages
   • Remote caching disabled

cache miss, executing a54116c1c1b89125
$ tsc --noEmit
cache miss, executing 73eab0d0b7f26986
$ tsc --noEmit
cache miss, executing 483ab3e9a891ad17
$ tsc --noEmit
cache miss, executing 7a3e9f20d7e97cd1
$ tsc --noEmit
cache miss, executing ddbc56d968b573c8
$ tsc --noEmit
cache miss, executing 21a9a9ccee386aa7
$ tsc --noEmit
cache miss, executing c25f7fcc707aeb0c
$ tsc --noEmit
cache miss, executing e642a892a88c2bcb
$ tsc --noEmit
cache miss, executing d09d575f9f7b251a
$ tsc --noEmit
cache miss, executing 440a5ea6c4493b09
$ tsc --noEmit
cache miss, executing 510a8677638a9a84
$ tsc --noEmit
[;31m@uiforge/mcp-server:typecheck[;0m
cache miss, executing 3f391224c836f420
$ tsc --noEmit
  Type 'undefined' is not assignable to type 'string'.
  'string' index signatures are incompatible.
    Type 'string | string[]' is not assignable to type 'string'.
      Type 'string[]' is not assignable to type 'string'.
  Overload 1 of 2, '(name: string, config: { title?: string | undefined; description?: string | undefined; inputSchema?: T | undefined; outputSchema?: ZodObject<{ schemaVersion: ZodString; mcpVersion: ZodLiteral<...>; ... 4 more ...; warnings: ZodOptional<...>; }, $strip> | undefined; annotations?: { ...; } | undefined; icons?: { ...; }[] | undefined; scopeChallenge?: ScopeChallengeHandler | undefined; _meta?: Record<...> | undefined; }, cb: BaseToolCallback<...>): RegisteredTool', gave the following error.
    Argument of type '(args: unknown) => Promise<unknown>' is not assignable to parameter of type 'BaseToolCallback<InputRequiredResult | { [x: string]: unknown; content: ({ type: "text"; text: string; annotations?: { audience?: ("user" | "assistant")[] | undefined; priority?: number | undefined; lastModified?: string | undefined; } | undefined; _meta?: { ...; } | undefined; } | { ...; } | { ...; } | { ...; } | {...'.
  Overload 2 of 2, '(name: string, config: { title?: string | undefined; description?: string | undefined; inputSchema?: ZodRawShape | undefined; outputSchema?: ZodObject<{ schemaVersion: ZodString; ... 5 more ...; warnings: ZodOptional<...>; }, $strip> | undefined; annotations?: { ...; } | undefined; icons?: { ...; }[] | undefined; scopeChallenge?: ScopeChallengeHandler | undefined; _meta?: Record<...> | undefined; }, cb: (args: { ...; }, ctx: ServerContext) => InputRequiredResult | ... 1 more ... | Promise<...>): RegisteredTool', gave the following error.
    Type 'T' is not assignable to type 'ZodRawShape | undefined'.
      Type 'ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>' is not assignable to type 'ZodRawShape'.
        Index signature for type 'string' is missing in type 'ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>'.
  Property 'text' does not exist on type '{ uri: string; blob: string; mimeType?: string | undefined; _meta?: { [x: string]: unknown; } | undefined; }'.
[ELIFECYCLE] Command failed with exit code 2.
cache miss, executing ca3c711cd37eefbc
$ tsc --noEmit
[ELIFECYCLE] Command failed with signal SIGINT.
cache miss, executing 67a176a89559eab9
$ tsc --noEmit
[ELIFECYCLE] Command failed with signal SIGINT.
@uiforge/mcp-server#typecheck:  ERROR  command (/home/runner/work/UIForge/UIForge/apps/mcp-server) /home/runner/setup-pnpm/node_modules/.bin/pnpm run typecheck exited (2)
cache miss, executing fb2c79252c75b7bf
$ tsc --noEmit
[ELIFECYCLE] Command failed with signal SIGINT.

 Tasks:    11 successful, 15 total
Cached:    0 cached, 15 total
  Time:    9.236s 
Failed:    @uiforge/mcp-server#typecheck

 ERROR  run failed: command  exited (2)
[ELIFECYCLE] Command failed with exit code 2.
with:
  name: mcp-report
  path: artifacts/mcp/
  if-no-files-found: warn
  compression-level: 6
  overwrite: false
  include-hidden-files: false
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
(node:3106) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
with:
  name: ui-schema-report
  path: artifacts/ui-schema/
  if-no-files-found: error
  compression-level: 6
  overwrite: false
  include-hidden-files: false
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
(node:3118) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
with:
  name: design-token-report
  path: artifacts/design-tokens/
  if-no-files-found: error
  compression-level: 6
  overwrite: false
  include-hidden-files: false
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
(node:3130) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
with:
  name: editor-report
  path: artifacts/editor/
  if-no-files-found: error
  compression-level: 6
  overwrite: false
  include-hidden-files: false
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
(node:3142) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
With the provided path, there will be 1 file uploaded
Artifact name is valid!
Root directory input is valid!
Beginning upload of artifact content to blob storage
(node:3142) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead. CVEs are not issued for `url.parse()` vulnerabilities.
Uploaded bytes 326
Finished uploading artifact content to blob storage!
SHA256 digest of uploaded artifact zip is aa7b2df3d09cb5717f90f080f078176bcbfe7072f9c92bd45b58471701d7ab00
Finalizing artifact upload
Artifact editor-report.zip successfully finalized. Artifact ID 11148446267
Artifact editor-report has been successfully uploaded! Final size is 326 bytes. Artifact ID is 11148446267
Artifact download URL: https://github.com/tuanpham09/UIForge/actions/runs/36832851879/artifacts/11148446267
with:
  name: renderer-report
  path: artifacts/renderer/
  if-no-files-found: error
  compression-level: 6
  overwrite: false
  include-hidden-files: false
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
(node:3154) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[36;1mmkdir -p artifacts/foundation[0m
[36;1mnode --version > artifacts/foundation/toolchain.txt[0m
[36;1mpnpm --version >> artifacts/foundation/toolchain.txt[0m
[36;1mnode -e "const p=require('./package.json'); console.log(JSON.stringify({name:p.name,packageManager:p.packageManager,engines:p.engines},null,2))" > artifacts/foundation/package-metadata.json[0m
[36;1mgit ls-files apps packages tests .github/workflows > artifacts/foundation/repository-tree.txt[0m
shell: /usr/bin/bash --noprofile --norc -e -o pipefail {0}
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
with:
  name: foundation-report
  path: artifacts/foundation/
  if-no-files-found: error
  compression-level: 6
  overwrite: false
  include-hidden-files: false
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
(node:3185) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
With the provided path, there will be 3 files uploaded
Artifact name is valid!
Root directory input is valid!
Beginning upload of artifact content to blob storage
(node:3185) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead. CVEs are not issued for `url.parse()` vulnerabilities.
Uploaded bytes 1361
Finished uploading artifact content to blob storage!
SHA256 digest of uploaded artifact zip is 41d01b727d98591e950c73071b0b0a6b887a7e08c9b79b4779108e5d52c225b3
Finalizing artifact upload
Artifact foundation-report.zip successfully finalized. Artifact ID 11147597760
Artifact foundation-report has been successfully uploaded! Final size is 1361 bytes. Artifact ID is 11147597760
Artifact download URL: https://github.com/tuanpham09/UIForge/actions/runs/36832851879/artifacts/11147597760
with:
  name: playwright-report
  path: playwright-report/
  if-no-files-found: warn
  compression-level: 6
  overwrite: false
  include-hidden-files: false
env:
  PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
(node:3197) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Post job cleanup.
Pruning is unnecessary.
Post job cleanup.
[command]/usr/bin/git version
git version 2.55.0
Temporarily overriding HOME='/home/runner/work/_temp/6db6e1bc-8f80-46e3-8143-4199dec5e1de' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
[command]/usr/bin/git config --global --add safe.directory /home/runner/work/UIForge/UIForge
[command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
[command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
[command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
http.https://github.com/.extraheader
[command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
[command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
[command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
[command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
Cleaning up orphan processes
