# UIForge Roadmap

## Phase dependency graph

~~~mermaid
flowchart TB
    P0["P0 Foundation<br/>#1"]
    P1["P1 Semantic Product Core + Design Intelligence<br/>#2 #3 #6 #21 #22 #23 #4 #5"]
    P2["P2 AI Design<br/>#7 #8 #9"]
    P3["P3 Agent Bridge<br/>#10 #11 #12"]
    P4["P4 Design-to-Code<br/>#13 #14"]
    P5["P5 Quality<br/>#15 #16"]
    P6["P6 Hosted Product<br/>#17"]
    P7["P7 Codebase Intelligence<br/>#18 #19"]
    P8["P8 Production<br/>#20"]

    P0 --> P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8
~~~

## Phase 0 — Foundation

**Issue #1**

Goal: make the repository safe for autonomous implementation.

Outputs:
- monorepo;
- CI;
- typecheck/lint/test/build gates;
- Playwright skeleton;
- package boundary rules.

## Phase 1 — Semantic Product Core + Design Intelligence

**Issues #2–#6 + #21 + #22 + #23**

Goal: establish the canonical design language, product-flow model and reusable design-intelligence layer. A screen is only one part of the product specification; user journeys, transitions and design strategy are first-class.

Outputs:
- UI Schema v1;
- typed command model;
- design tokens;
- Product Experience Graph;
- Design Skill Registry;
- deterministic Design Strategy;
- Color Intelligence + project-wide palette strategy;
- tldraw flow-aware adapter;
- deterministic renderer;
- component registry.

## Phase 2 — AI Design

**Issues #7–#9, consuming #22 + #23**

Goal: safely generate and modify semantic UI from Product Intent + validated Design Strategy.

Outputs:
- provider abstraction;
- Product Intent normalization;
- structured AI pipeline;
- Design Strategy consumption;
- text-to-UI;
- screenshot-to-UI;
- confidence/validation.

## Phase 3 — Agent Bridge

**Issues #10–#12**

Goal: expose the design system to external agents.

Outputs:
- real code mappings;
- read-only MCP;
- mutation capabilities;
- authorization;
- audit trail.

## Phase 4 — Design-to-Code

**Issues #13–#14**

Goal: generate implementation-ready React code.

Outputs:
- code specification;
- React/Next.js/Tailwind v4/shadcn/Base UI generator;
- compile gate.

## Phase 5 — Quality

**Issues #15–#16**

Goal: make responsive behavior and visual fidelity testable.

Outputs:
- responsive rules;
- multi-viewport validation;
- deterministic screenshots;
- visual diffs.

## Phase 6 — Hosted Product

**Issue #17**

Goal: persist projects safely.

Outputs:
- auth;
- projects;
- revisions;
- assets;
- RLS;
- audit events.

## Phase 7 — Codebase Intelligence

**Issues #18–#19**

Goal: make the agent reuse real project components and prove the full loop.

Outputs:
- GitHub indexing;
- component mapping;
- external-agent benchmark;
- MCP compatibility evidence;
- visual QA loop.

## Phase 8 — Production

**Issue #20**

Goal: prepare controlled alpha/beta operation.

Outputs:
- security hardening;
- rate/cost controls;
- observability;
- deployment;
- backup/recovery;
- launch runbook.

## Milestones

### M0 — Repository ready
Issue #1 complete.

### M1 — First editable product experience
Issues #2–#6 + #21 + #22 + #23 complete:
fixture → schema + experience graph → flow-aware canvas → preview/prototype.

### M2 — AI product experience
Issues #7–#9 complete:
prompt/screenshot → Product Intent/Design Strategy → validated editable UI + generated/updated flows where applicable.

### M3 — MCP demo
Issues #10–#12 complete:
external agent can inspect and safely mutate design.

### M4 — Design-to-code
Issues #13–#14 complete:
external agent can implement a React screen from UIForge context.

### M5 — Visual + Interaction QA loop
Issues #15–#16 complete:
responsive, visual and interaction-flow mismatch detection works.

### M6 — Hosted alpha
Issue #17 complete:
auth, persistence, revisions and assets.

### M7 — Agent-native beta
Issues #18–#20 complete:
real codebase mapping, external-agent benchmark and production controls.

## Completion rule

A milestone is not complete because source code exists. It requires real runtime verification, tests, CI, reviewed artifacts and an issue evidence comment, following AGENTS.md.
