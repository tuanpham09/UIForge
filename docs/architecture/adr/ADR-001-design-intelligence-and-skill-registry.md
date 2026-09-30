# ADR-001 — Design Intelligence and UI/UX Skill Registry

## Context

A short request such as "design an expense management app" contains product intent but does not directly specify information architecture, navigation, interaction patterns, responsive behavior, accessibility constraints or domain-specific UX patterns.

Encoding those decisions in one large AI prompt creates poor reuse, weak testability and provider coupling.

UIForge already defines UI Schema as the canonical visual contract and Product Experience Graph as the canonical behavioral contract. A separate planning layer is needed to explain how the product should be designed before those contracts are generated.

## Decision

Introduce `packages/design-intelligence` with three core responsibilities:

1. **Skill Registry** — versioned, provider-independent design knowledge modules.
2. **Skill Discovery + Composition** — deterministic selection and conflict resolution.
3. **Design Strategy** — a versioned intermediate artifact describing the recommended information architecture, navigation, screen archetypes, component/interaction patterns, responsive strategy, accessibility constraints and anti-patterns.

Pipeline:

`User Intent → Product Intent → Skill Discovery → Skill Composition → Design Strategy → Experience Graph + UI Schema → Design System → Canvas/Prototype`

The Design Strategy is not a second source of truth. Persisted screens/components remain in UI Schema; persisted behavior remains in Product Experience Graph.

Skills must be explainable through metadata/provenance. Internal relevance ranking is allowed, but UIForge must not present a universal objective design score or claim a single "best" design.

## Alternatives

### Put design knowledge in AI prompts

Rejected because prompts are difficult to version, compose, validate and reuse across providers.

### Put all UX rules directly in UI Schema

Rejected because the schema would mix product output contracts with generative planning knowledge.

### Let the model freely invent patterns per request

Rejected for the core workflow because outputs become harder to reproduce and validate.

### Build a community skill marketplace first

Deferred. The first implementation should use a curated, versioned registry and prove deterministic composition.

## Consequences

### Positive

- design reasoning becomes inspectable before generation;
- domain-specific patterns can be reused across providers;
- AI generation can start from a coherent strategy instead of isolated screens;
- skill composition can be tested independently;
- future MCP exposure can provide design strategy/provenance to coding agents.

### Negative

- adds a new semantic package and contracts;
- requires maintaining skill metadata and compatibility rules;
- bad composition rules can over-constrain creativity;
- the registry must evolve as domains grow.

## Revisit conditions

Revisit the boundary when:
- the registry becomes a generalized rules engine;
- strategy persistence starts duplicating UI Schema or Experience Graph;
- skill authoring becomes a public marketplace concern;
- external-agent benchmarks show the strategy layer is not improving downstream fidelity.
