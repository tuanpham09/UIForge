# UIForge

> **Design once. Let agents build it.**

UIForge is an AI-native UI specification and design workspace built for software agents.

Instead of treating a canvas as the source of truth, UIForge treats a **versioned UI Schema** as the source of truth and uses the canvas, AI, renderers, code generators, and MCP as projections of that schema.

## Why UIForge exists

Most design-to-code workflows lose information between design and implementation:

- visual layout becomes an ambiguous screenshot;
- design tokens become hard-coded values;
- components are recreated instead of mapped to the real codebase;
- responsive rules disappear;
- AI agents receive too much raw canvas data and too little semantic context;
- visual regressions are discovered only after implementation.

UIForge is designed around a different contract:

`Intent → UI Schema → Design System → MCP → Agent → Code → Visual QA → Fix`

The product is **not** "another AI UI generator". Its core asset is a machine-readable UI specification that humans can edit visually and agents can consume deterministically.

## Product principles

1. **Schema first** — the UI Schema is the canonical representation.
2. **Agent first** — every important design decision must be queryable through MCP.
3. **Design-system first** — arbitrary one-off values are discouraged when a token/component exists.
4. **Renderer independent** — tldraw is an editor adapter, not the persistence model.
5. **Provider independent** — AI providers are behind stable contracts.
6. **Human controlled** — AI proposes/apply changes with inspectable diffs.
7. **Evidence driven** — a feature is not complete until tests and real artifacts prove it.
8. **Small modules** — avoid monolithic editor, AI, MCP, or persistence files.
9. **Deterministic where possible** — fixtures, snapshots, seeded examples, stable rendering.
10. **Progressive complexity** — MVP solves one complete loop before adding collaboration or multi-framework codegen.

## Core workflow

```mermaid
flowchart LR
    A[Product intent] --> B[AI design agent]
    B --> C[UI Schema]
    C --> D[Design tokens]
    C --> E[Component registry]
    C --> F[Canvas]
    C --> G[Preview renderer]
    C --> H[MCP]
    H --> I[Cursor / Claude / Codex / other agents]
    I --> J[Codebase]
    J --> K[Browser render]
    K --> L[Visual QA]
    L -->|mismatch| I
    L -->|pass| M[Evidence]
```

## Phase roadmap

```mermaid
flowchart TB
    P0["P0 Foundation<br/>product contract + repo + CI"]
    P1["P1 UI Core<br/>schema + tokens + editor + renderer"]
    P2["P2 AI<br/>text-to-UI + screenshot-to-UI"]
    P3["P3 Agent Bridge<br/>component registry + MCP"]
    P4["P4 Code Loop<br/>React/Tailwind/shadcn code spec + generator"]
    P5["P5 Quality<br/>responsive + visual QA + benchmarks"]
    P6["P6 Persistence<br/>auth + projects + versioning + assets"]
    P7["P7 Codebase Intelligence<br/>GitHub indexing + real component mapping"]
    P8["P8 Production<br/>security + observability + deploy + launch"]

    P0 --> P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8
```

## MVP definition

The first credible MVP is complete when a user can:

1. create a project;
2. describe a screen in natural language;
3. generate an editable UI;
4. inspect its semantic layer tree;
5. edit components/tokens manually;
6. expose the design through a remote MCP endpoint;
7. ask an agent to implement the screen in React + Tailwind + shadcn/ui;
8. render the implementation in a browser;
9. compare it against the design;
10. produce evidence showing the design-to-code loop works.

## Target architecture

```
apps/
  web/                 # Next.js product/editor
  mcp-server/          # remote MCP server

packages/
  ui-schema/            # canonical schema + validators
  design-tokens/        # token model + resolution
  component-registry/   # semantic components + code mappings
  editor/               # tldraw adapter and editor commands
  renderer/             # schema -> deterministic web preview
  ai/                   # provider-independent AI orchestration
  codegen/              # code specs and React/Tailwind generation
  visual-qa/            # screenshot/render comparison
  shared/               # contracts and utilities

docs/
  architecture/
  design-system/
  mcp/
  research/
  roadmap/
  operations/
```

## Technology baseline

- **TypeScript** end-to-end.
- **Next.js App Router** for the web application.
- **React 19.3** baseline.
- **Tailwind CSS v4** for the product UI and generated web target.
- **shadcn/ui + Base UI** as the default implementation component foundation, while keeping the registry abstraction framework/library neutral.
- **tldraw** as the interactive canvas/editor adapter.
- **Zustand** for local editor state where React state is insufficient.
- **TanStack Query** for server state.
- **Supabase/Postgres** for persistence/auth/storage in the initial hosted architecture.
- **MCP TypeScript SDK** for the agent bridge.
- **AI SDK** for model/provider orchestration.
- **Playwright** for browser and visual regression testing.
- **Vitest** for unit/contract tests.
- **pnpm workspaces + Turborepo** for the monorepo.
- **GitHub Actions** for CI.

Technology choices are intentionally replaceable behind package contracts.

## MCP contract

The MCP server will expose three categories:

### Resources

- `ui://project`
- `ui://screens`
- `ui://screen/{id}`
- `ui://component/{id}`
- `ui://tokens`
- `ui://assets`
- `ui://flow/{id}`

### Read tools

- `get_project`
- `get_screen`
- `get_layout_tree`
- `get_component`
- `get_component_registry`
- `get_design_tokens`
- `get_code_mapping`
- `get_responsive_rules`
- `get_code_spec`
- `validate_design`

### Mutation tools

Mutations are gated and auditable:

- `create_screen`
- `update_screen`
- `create_component_instance`
- `update_node`
- `move_node`
- `update_token`

Production mutation requires explicit project capability and an audit trail.

MCP follows the protocol's Resources/Tools/Prompts model and should use Streamable HTTP for hosted production connections. citeturn1search0turn1search2

## Design consistency rules

The design system is governed by `docs/design-system/RULES.md`.

At minimum:

- no arbitrary spacing when a semantic spacing token exists;
- no arbitrary colors outside documented semantic tokens;
- typography uses a defined scale;
- radii, shadows, borders and controls use tokens;
- components have semantic names and variants;
- layout uses constraints/grid/flex semantics, not only absolute coordinates;
- mobile/tablet/desktop behavior is explicit;
- interactive states are defined;
- accessibility semantics are retained;
- code mappings are part of the component contract;
- AI-generated changes must preserve existing design-system invariants.

## Quality gate

A feature is not "done" because TypeScript compiles.

The completion gate is:

`Implement → Unit/Contract Tests → CI → Real Runtime → Artifact → Visual/Behavior Inspection → PR CI → Main CI → Evidence Comment → Close Issue`

Required evidence depends on the feature:

- screenshots for visual UI changes;
- schema fixture/output for schema changes;
- MCP request/response transcript for MCP changes;
- generated code + build/test output for codegen;
- Playwright screenshots/diff for visual QA;
- production-like runtime output for end-to-end features.

## Risk strategy

High-risk areas are isolated behind contracts:

| Risk | Mitigation |
|---|---|
| AI produces inconsistent UI | schema validation + constrained component registry + deterministic post-processing |
| Canvas becomes source of truth | schema-first architecture; tldraw adapter only |
| MCP context becomes huge | semantic, scoped resources/tools + pagination/selection |
| MCP mutation is unsafe | capability flags + validation + audit log + idempotency |
| Provider lock-in | AIProvider interface and model metadata |
| Visual tests flaky | pinned browser/runtime + stable fixtures + controlled fonts/data |
| Design drift | tokens + registry + visual QA |
| Codegen creates duplicate components | code mapping + project registry |
| Schema evolves incompatibly | versioned schema + migrations + fixtures |
| Multi-tenant data leak | Postgres RLS + server-side authorization + negative tests |
| Large editor becomes slow | normalized state + spatial queries + incremental rendering |
| Vendor API changes | adapter packages + contract tests + version pinning |

## Development workflow

1. Read the relevant issue and linked architecture docs.
2. Do not implement outside the issue scope.
3. Write/update tests before or with implementation.
4. Keep files small and responsibilities explicit.
5. Run local tests and real runtime verification.
6. Attach evidence to the PR/issue.
7. Verify CI artifacts.
8. Merge only after required gates pass.
9. Re-verify main branch before closing the issue.

See [AGENTS.md](AGENTS.md) for the full agent contract.

## Current status

This repository starts as a specification-first foundation. Implementation should follow the numbered GitHub issues in dependency order.

## Research references

- Model Context Protocol specification and 2026 updates. citeturn1search0turn1search1
- Figma MCP demonstrates the market direction of structured design context and write-back. citeturn0search3turn0search21
- tldraw provides AI/editor integration patterns and LLM-oriented documentation. citeturn0search14turn0search4
- React 19.3 is the current React major/minor baseline in the official docs. citeturn0search12turn0search19
- Tailwind CSS v4 provides CSS-first tokens, modern browser primitives and container queries. citeturn1search3turn1search4
- shadcn/ui is open-code and explicitly AI-ready; new projects default to Base UI as of July 2026. citeturn0search2turn0search17
- Supabase recommends RLS for exposed tables and explicit security tests. citeturn0search1turn0search20
- Playwright supports deterministic screenshot comparison with `toHaveScreenshot`. citeturn1search5
