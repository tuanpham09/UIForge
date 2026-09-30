# ADR-002 — Project-wide Color Strategy

## Context

AI-generated screens can independently select colors, creating palette drift and inconsistent visual hierarchy. UIForge needs a shared visual tone established before the first screen is generated.

Visual inspiration sources such as Dribbble can help explore style directions, but they are not authoritative for accessibility or semantic color usage.

## Decision

Introduce a versioned **Color Strategy** established during project design initialization.

Minimum roles:

- primary;
- secondary;
- optional accent;
- background/surface/surfaceVariant;
- foreground/mutedForeground;
- border/focus;
- success/warning/error/info;
- chart/data-visualization roles;
- light/dark mappings;
- tonal scales.

The strategy is consumed by Design Tokens and UI Schema. Screens reference semantic roles rather than choosing raw colors independently.

Color selection follows:

`Product meaning/brand intent → accessibility → hierarchy/role clarity → harmony → context → visual inspiration`

Accessibility constraints are normative gates; UIForge palette heuristics are explicit heuristics; aesthetic inspiration is advisory.

Tonal scales should use a perceptual color representation such as OKLCH where supported by the target stack.

## Rules

- One primary and one secondary anchor by default.
- Accent is optional and needs a semantic purpose.
- Large surfaces default to neutral/surface roles unless strategy explicitly calls for brand surfaces.
- Status colors keep stable semantic meaning.
- No color-only communication for important state/information.
- No screen-specific palette invention after Color Strategy is locked.
- New colors require an existing semantic role or an explicit design-system exception.
- Contrast validation is a hard gate for applicable usage.
- Common palette ratios such as 60/30/10 are optional heuristics, not requirements.

## Alternatives

### Let every screen choose its own colors

Rejected because it creates visual drift.

### Use only a fixed global palette

Rejected because different products need distinct brand personalities.

### Copy palettes from inspiration galleries

Rejected because inspiration does not provide product context or accessibility guarantees.

## Consequences

### Positive

- coherent project-wide visual identity;
- deterministic generation;
- easier visual QA;
- simpler codegen and MCP context;
- fewer accidental low-contrast choices.

### Negative

- initial palette selection adds a planning step;
- bad strategy choices can propagate to many screens;
- palette governance requires explicit exception handling.

## Revisit conditions

Revisit when:
- brand-guideline import becomes a first-class feature;
- multi-brand projects need scoped palettes;
- accessibility standards materially change;
- benchmark evidence shows the current palette constraints harm useful design variation.
