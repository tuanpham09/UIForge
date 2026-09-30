# UIForge Research Baseline — September 2026

## Product landscape

The current market validates several pieces of the workflow:

- Figma MCP exposes design context to agents and can write native content back to the canvas.
- tldraw supports AI models reading a canvas and creating/manipulating shapes, and provides an agent starter pattern.
- shadcn/ui is explicitly open-code and AI-ready; its current new-project default is Base UI while Radix remains supported.
- Tailwind v4 exposes CSS-first theme variables and modern browser primitives that fit a token-driven renderer.
- React 19.3 is the current official React release documented by the React team.
- Playwright provides screenshot comparison and documents the need for controlled rendering environments.
- Supabase documents RLS as a core security mechanism for exposed Postgres tables and recommends explicit allow/deny testing.

## MCP direction

The MCP specification separates:

- Prompts — user-controlled;
- Resources — application-controlled context;
- Tools — model-controlled actions.

The July 2026 MCP specification update added cache metadata to list/read results and continued tightening authorization semantics. This matters for UIForge because screen/component resources can become heavily cached while mutations require stricter authorization.

AI SDK guidance recommends Streamable HTTP for production MCP connections and stdio for local servers.

## Architecture implications

1. MCP must be a first-class public contract.
2. Read and write capabilities should be separated.
3. Responses need cache/version metadata.
4. Project context must be scoped.
5. Mutation operations need auditability and idempotency.
6. The UI Schema must be more semantic than a canvas JSON dump.

## Canvas implications

tldraw is a strong MVP canvas because it already supports AI integration and custom shapes. Its documentation also ships LLM-oriented bundles, making it easier for coding agents to work against the SDK.

The architecture should still prevent tldraw types from becoming the domain model.

## Code target implications

The initial web target should be:

- React 19.3;
- Next.js App Router;
- Tailwind v4;
- shadcn/ui/Base UI.

The target is deliberately narrow. Multi-framework generation is a later adapter problem.

## Security implications

Supabase's current guidance is clear: exposed tables need RLS, grants and policies must be considered together, and service credentials must remain server-side.

UIForge therefore treats authorization as an architecture concern, not a launch checklist item.

## Visual QA implications

Playwright screenshot baselines should run in a controlled environment. OS, browser, fonts and rendering conditions can alter pixels.

UIForge will therefore:

- pin browser versions in CI;
- control fixture data;
- use stable fonts;
- disable dynamic timestamps/randomness;
- store reviewed baselines;
- report diff artifacts.

## Decisions

### Chosen

- TypeScript monorepo.
- Next.js App Router.
- React 19.3 baseline.
- Tailwind v4.
- shadcn/ui/Base UI.
- tldraw adapter.
- Supabase/Postgres.
- MCP TypeScript SDK v2 (`@modelcontextprotocol/server` / `@modelcontextprotocol/client`).
- AI SDK.
- Playwright.
- Vitest.
- pnpm + Turborepo.

### Explicitly deferred

- Figma parity.
- multiplayer collaboration.
- full Figma import/export.
- Flutter/SwiftUI codegen.
- marketplace.
- plugin marketplace.
- advanced animation timeline;
- Figma-level prototype parity;
- pixel-level canvas parity with Stitch/Figma.

The goal is to prove the agent-native design-to-code loop before expanding the surface area.


## September 2026 MCP update

The official TypeScript SDK now documents v2 as the stable release line for the 2026-07-28 MCP specification. The server and client packages are split, and Streamable HTTP is the current hosted transport. UIForge should therefore isolate MCP transport/version details behind the MCP adapter rather than letting protocol details leak into the UI Schema.

## Official references

- MCP specification: https://modelcontextprotocol.io/specification/
- MCP 2026-07-28 update: https://blog.modelcontextprotocol.io/posts/2026-07-28/
- MCP TypeScript SDK v2: https://github.com/modelcontextprotocol/typescript-sdk
- Figma MCP: https://developers.figma.com/docs/figma-mcp-server/
- tldraw AI: https://tldraw.dev/docs/ai
- React versions: https://react.dev/versions
- Next.js: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs/upgrade-guide
- shadcn/ui: https://ui.shadcn.com/docs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Playwright snapshots: https://playwright.dev/docs/next/test-snapshots
