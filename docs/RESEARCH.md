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

## Design intelligence direction

UIForge should treat design expertise as reusable semantic skills rather than a large provider prompt. The intended chain is:

`Product Intent → Skill Discovery → Skill Composition → Design Strategy → Experience Graph + UI Schema`

A Design Skill can package domain applicability, UX patterns, information architecture, component/layout patterns, interaction rules, responsive rules, accessibility constraints and anti-patterns. The initial registry should be curated, versioned and composable; a future marketplace is outside the current scope.

Selection should be explainable from matching metadata. An internal ordering mechanism may help choose among compatible skills, but UIForge should not present a universal numeric "best UI" score as though design had one objective optimum.

## Color intelligence direction

UIForge should establish a project-wide Color Strategy before the first screen is generated. Primary and secondary act as the default brand anchors; an accent is optional and must have a defined role. The strategy then derives semantic surface, foreground, border, focus, status and chart roles plus light/dark mappings.

The design rationale is deliberately split into three layers:

1. **Normative accessibility constraints** — WCAG contrast/use-of-color requirements.
2. **UIForge design heuristics** — restrained accent usage, neutral-heavy content surfaces, semantic status colors, tonal-scale consistency and avoidance of random palette proliferation.
3. **Aesthetic inspiration** — visual references such as Dribbble palette/style explorations.

Dribbble is therefore a source of visual inspiration rather than an authority for UX/accessibility. citeturn844906search0turn844906search36

For applicable text, WCAG 2.2 Level AA requires at least 4.5:1 contrast for normal text and 3:1 for large text. Applicable non-text UI components and meaningful graphics require 3:1 against adjacent colors, and color must not be the sole visual means of conveying meaning. citeturn844906search2turn957451search0turn957451search1

Tailwind's current palette exposes OKLCH values and its theme system is token-oriented; shadcn/ui likewise uses semantic background/foreground pairs and OKLCH examples. This supports storing semantic roles in UIForge while using perceptual values for tonal-scale generation. citeturn301146search0turn301146search1

## Architecture implications

1. Design intelligence must be a first-class semantic layer between Product Intent and generation.
2. MCP must be a first-class public contract.
3. Read and write capabilities should be separated.
4. Responses need cache/version metadata.
5. Project context must be scoped.
6. Mutation operations need auditability and idempotency.
7. The UI Schema must be more semantic than a canvas JSON dump.
8. Design knowledge must be versioned, testable and reusable independently of AI providers.

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

## Product flow research update

The design direction should learn from both Stitch-style AI generation and Figma-style prototype flows without cloning either product. The key architectural takeaway is that a product design needs two complementary semantic views:

1. **Visual contract** — screens, components, layout, tokens and responsive behavior.
2. **Behavioral contract** — user journeys, starting points, triggers, actions, destinations, conditions and transitions.

Figma's prototype model is useful evidence that explicit connections, destinations and actions make flows understandable. Stitch's project/canvas-oriented AI workflow is useful evidence that AI should reason across multiple screens rather than generate isolated frames. UIForge should combine those lessons while keeping its own framework-neutral schema and Experience Graph as the source of truth.

The **Product Experience Graph** therefore becomes a P1 domain primitive, not a prototype-only feature.

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
