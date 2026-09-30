# UIForge Agent Contract

This file is mandatory context for every coding agent working in UIForge.

## 1. Mission

UIForge is an AI-native product experience and UI specification platform. The semantic chain is **User Intent → Product Intent → Design Strategy → versioned UI Schema + Product Experience Graph**, while canvas, preview and generated code remain projections.

The canonical design contracts are **UI Schema + Product Experience Graph**. Design Strategy is the validated intermediate plan that explains how the product should be designed before those canonical models are generated.

Every implementation must protect this invariant:

`UI Schema + Experience Graph → Canvas / Prototype / Preview / MCP / Codegen`

## 2. Non-negotiable rules

### Rule A — Issue first

Do not start implementation unless a GitHub issue exists with:

- explicit goal;
- problem statement;
- scope;
- non-goals;
- technical approach;
- acceptance criteria;
- tests;
- evidence requirements;
- handoff;
- dependencies.

If the issue is underspecified, update it before coding.

### Rule B — One issue, one coherent outcome

Do not silently expand scope. If implementation discovers another problem:

1. document it;
2. create/link a follow-up issue;
3. keep the current change focused.

### Rule C — Schema is canonical

Never make tldraw JSON, DOM output, screenshots, or generated code the canonical persistence format.

All meaningful design state must be representable in the versioned UI Schema.

### Rule D — Design intent is semantic

Product Intent, Design Strategy, UI Schema and Experience Graph must remain inspectable and versioned. Reusable UI/UX knowledge belongs in the Design Skill Registry, not in opaque provider prompts.

Design Strategy must record selected skill IDs and provenance/rationale metadata. It must not become a second source of truth for persisted screens or flows.

### Rule E — Product flow is semantic

A screen is not a complete product specification. Navigation and interaction behavior must be represented by the Product Experience Graph.

Every meaningful transition must preserve:

- source screen/node;
- trigger;
- action;
- destination;
- optional condition;
- optional animation metadata.

Canvas connections and prototype records are projections, not canonical behavior.

### Rule F — Semantic layout over pixels

Absolute x/y values may exist for editor rendering, but the semantic model must preserve:

- hierarchy;
- layout mode;
- constraints;
- spacing tokens;
- sizing;
- alignment;
- responsive behavior.

### Rule G — Design-system consistency

Use semantic tokens and registered components. Do not invent a new color, spacing value, radius, typography style, or component variant when an existing semantic token/variant applies.

### Rule H — Provider abstraction

AI providers must implement stable interfaces. Provider SDK types must not leak into `ui-schema`, editor core, renderer core, or MCP contracts.

### Rule I — MCP stability

MCP output is a public integration contract. Tool names, resource URIs, input schemas, and semantic meanings require tests and compatibility review.

### Rule J — Security by default

- Never expose service-role/database secrets to the browser.
- All tenant/project data is authorization checked.
- Exposed Supabase tables require RLS.
- MCP mutation endpoints require authentication/capability checks.
- Audit mutation operations.
- Validate all external input.

### Rule K — Test first

Minimum testing for `design-intelligence` includes skill-contract, registry lookup, deterministic discovery, composition/conflict resolution, semantic-reference validation and Design Strategy fixture tests.

Minimum testing by layer:

- experience-graph: unit + graph validation + fixture/contract tests;

- schema: unit + fixture/contract tests;
- editor: interaction tests;
- renderer: component tests + visual snapshots;
- AI: deterministic mocked provider tests + selected live smoke tests;
- MCP: protocol contract tests;
- persistence: RLS allow/deny tests;
- codegen: golden output + compile test;
- E2E: Playwright;
- visual QA: screenshot comparison.

### Rule L — Evidence is required

A green unit test is not enough.

For every completed issue, attach real evidence appropriate to the feature. Examples:

- `artifacts/schema-fixture.json`
- `artifacts/mcp-transcript.json`
- `artifacts/generated-dashboard/`
- `artifacts/screenshots/`
- `artifacts/visual-diff.png`
- CI run URL
- short screen recording for editor interactions when useful

### Rule M — Close only after main verification

Required lifecycle:

`Issue → Branch → Implement → Test → PR → CI → Review → Merge → Main CI → Verify Artifact → Comment Evidence → Close`

Do not close an issue immediately after PR merge.

### Rule N — Small files

Prefer modules with one reason to change. Avoid:

- 1,000+ line editor components;
- provider-specific logic in domain models;
- giant MCP routers;
- giant AI prompts;
- generated code mixed with business logic.

## 3. Architecture boundaries

```
apps/web
  ↓
packages/editor
  ↓
packages/design-intelligence
  ↓
packages/ui-schema
  ↓
packages/design-tokens
  ↓
packages/component-registry

apps/mcp-server
  ↓
packages/mcp-contracts
  ↓
packages/ui-schema
  ↓
packages/component-registry

packages/ai
  ↓
packages/ui-schema
  ↓
packages/design-tokens
```

Dependency direction must not point from domain packages back into apps.

## 4. Design Intelligence rules

The design intelligence pipeline is:

`User Input → Product Intent → Skill Discovery → Skill Composition → Design Strategy → Experience Graph + UI Schema → Validate → Apply`

The Design Skill Registry is provider-independent. Skills may contain domain applicability, UX patterns, information architecture, component/layout patterns, interaction rules, responsive rules, accessibility constraints, anti-patterns, provenance and validation metadata.

Internal relevance ordering is an implementation detail; never expose a fake universal "best UI" score. Selection results must be explainable from matched metadata and constraints.

## 5. AI rules

AI output is untrusted until validated.

Pipeline:

`Prompt/Input → Model → Parse → Schema Validate → Normalize → Design-System Validate → Apply`

Never directly apply raw model JSON to the editor.

Every AI mutation must be represented as a typed command or patch.

## 6. MCP rules

Prefer small semantic tools over one giant `get_everything` tool.

Good:

- `get_screen`
- `get_layout_tree`
- `get_design_tokens`
- `get_component`
- `get_code_spec`

Bad:

- `dump_project_json`

MCP responses must be:

- scoped;
- typed;
- versioned where necessary;
- deterministic;
- concise enough for model context;
- explicit about IDs and relationships.

Production remote MCP uses Streamable HTTP. Local development may use stdio.

## 7. UI implementation rules

Before adding a UI primitive:

1. search the component registry;
2. search existing components;
3. prefer composition over duplication;
4. define states;
5. define keyboard behavior where relevant;
6. define accessible names/roles;
7. define responsive behavior;
8. define design tokens;
9. add visual coverage.

## 8. Performance rules

The editor must avoid unnecessary full-canvas rerenders.

Prefer:

- normalized entity state;
- selector-based subscriptions;
- memoized derived data;
- incremental schema updates;
- stable IDs;
- debounced persistence;
- lazy loading for heavy panels;
- virtualized large lists.

Do not optimize blindly. Add a benchmark before claiming a performance improvement.

## 9. Git and PR rules

Branch naming:

- `feat/<issue>-short-name`
- `fix/<issue>-short-name`
- `docs/<issue>-short-name`
- `chore/<issue>-short-name`

Commit convention:

`<type>(<scope>): <summary>`

PR must contain:

- issue link;
- summary;
- architecture impact;
- tests;
- evidence;
- known limitations;
- follow-up issues.

## 10. Handoff format

Every issue must end with:

### Handoff to next issue

- Completed:
- Contracts added:
- Files/modules introduced:
- Known limitations:
- Tests/evidence:
- Next issue:
- Do not repeat:
- Risks:

## 11. Definition of Done

An issue is complete only when:

- [ ] acceptance criteria satisfied;
- [ ] tests pass;
- [ ] CI passes;
- [ ] real runtime checked where applicable;
- [ ] evidence captured;
- [ ] documentation updated;
- [ ] no known out-of-scope regression;
- [ ] PR merged;
- [ ] main branch re-verified;
- [ ] evidence commented on the issue;
- [ ] issue closed.

