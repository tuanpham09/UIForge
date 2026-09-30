# ADR-005 — Semantic Design Token Engine

## Context

UIForge needs machine-enforced visual consistency across generated screens, editor projections, rendering and code generation. UI Schema #2 can reference semantic token names, but those names need deterministic storage, resolution and validation.

Color Strategy #23 is the upstream authority for project palette selection. The token engine must consume that strategy without creating a second palette model.

## Decision

Create `@uiforge/design-tokens` as a provider-independent semantic token engine.

The engine separates primitive values from semantic roles, resolves references deterministically, exports stable CSS variables, supports light/dark values, and validates raw-value exceptions.

Token names are stable API. Raw values are rejected unless explicitly recorded as exceptions with a reason and optional expiry.

Color Strategy integration is structural: #23 supplies versioned semantic roles; #3 maps those roles onto registered semantic color tokens. #3 does not choose project colors or invent screen-specific roles.

## Alternatives

- Store arbitrary CSS values directly in UI Schema — rejected because it causes design drift.
- Let each screen own a palette — rejected because project-wide color strategy must be consistent.
- Put token logic inside the editor — rejected because editor state is a projection, not canonical design state.

## Consequences

- AI and editor mutations can reference stable semantic token names.
- CSS export is deterministic and framework-independent.
- Light/dark theme changes do not require changing node semantics.
- Color Strategy remains a separate upstream concern.
- Future token migration must preserve stable token names or provide explicit migrations.

## Revisit conditions

Revisit when token versioning needs breaking changes, when additional target platforms require a richer export contract, or when #23 introduces Color Strategy roles that cannot map cleanly to the current semantic token registry.
