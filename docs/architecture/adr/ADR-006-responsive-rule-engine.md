# ADR-006 — Responsive Rule Engine

## Status

Accepted

## Context

UIForge must preserve semantic design intent across viewport changes. CSS media queries alone are an implementation detail and cannot safely express whether a component may disappear, reflow, change variant, or change navigation behavior.

## Decision

Introduce `@uiforge/responsive` with the versioned contract `uiforge.responsive/v1`.

The engine resolves explicit UI Schema responsive rules against canonical viewport presets:

- mobile: 390×844
- tablet: 768×1024
- desktop: 1024×768
- wide: 1440×900

Rules are applied in deterministic breakpoint order. No rule means no responsive transformation.

Navigation changes are represented as an interaction override and validated against the canonical Experience Graph adapter. The engine does not persist or own graph semantics.

Renderer and code generation consume the same resolved contract.

## Consequences

Positive:
- responsive behavior is inspectable and testable;
- renderer and generated code can share semantics;
- invalid navigation targets fail before implementation;
- viewport validation is deterministic.

Trade-offs:
- four canonical viewports are validation anchors, not a universal breakpoint model;
- consumers must provide explicit responsive rules for transformations;
- code generation must project the semantic result into framework-specific CSS/classes.
