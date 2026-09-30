# ADR-003 — Visual Craft Quality and Anti-AI UI Rules

## Context

High-level AI UI generation can produce semantically valid screens while still looking generic because micro-decisions are inconsistent: typography scale, card density, icon style, padding, radius, elevation and responsive composition.

Established design systems consistently use semantic type ramps, spacing systems, icon systems and component behavior rather than isolated visual values.

## Decision

Introduce a versioned **Visual Craft Strategy** as a semantic design layer.

The strategy governs:
- typography roles and desktop/mobile ramps;
- spacing rhythm and density;
- card usage/anatomy;
- SVG icon family, style, weight and size;
- radius/elevation;
- responsive composition;
- visual anti-pattern lint.

The default web icon provider is Lucide through an abstraction layer. The semantic model stores icon IDs; SVG rendering is downstream.

Visual quality rules distinguish:
1. normative accessibility constraints;
2. UIForge heuristics;
3. product-specific visual direction;
4. inspiration.

The system must never convert subjective visual quality into a universal numeric beauty score.

## Typography baseline

UIForge Web uses semantic desktop/mobile roles as a baseline. These are defaults, not platform accessibility minimums.

Desktop:
- display 36/44;
- page title 32/40;
- section title 24/32;
- subsection title 20/28;
- body 14/20;
- body large 16/24;
- label 12/16;
- control 14/20;
- metric 28/36.

Mobile:
- display 30/38;
- page title 28/36;
- section title 22/28;
- subsection title 18/24;
- body 14/20;
- body large 16/24;
- label 12/16;
- control 14/20;
- metric 24/32.

The strategy may adapt these roles for content, localization, platform and information density.

## Spacing baseline

Use a 4px base rhythm:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

Card density defaults:
- compact 12px;
- standard 16px;
- spacious 20–24px.

These are semantic defaults rather than universal laws.

## Icon baseline

- SVG/vector icons only for web UI iconography;
- semantic icon IDs, not stored SVG markup;
- consistent family and optical weight;
- common compact size 16px;
- 12px primarily informational/secondary;
- 20–24px for prominent navigation/actions depending on context;
- visible icon size is distinct from interactive hit area;
- no arbitrary icon family mixing;
- icon-only controls require accessible names.

## Card baseline

Cards are optional grouping/interaction primitives. A card must earn its visual boundary.

Allowed reasons include grouping, summary, preview, selectable item, interactive object or media/content unit.

Reject or flag:
- wrapping every section in a Card;
- repeated identical card grids with no content-driven variation;
- interactive cards containing conflicting child actions;
- strong border + shadow + large radius + tinted background without semantic reason.

## Anti-pattern lint

The validator produces deterministic findings tied to semantic IDs and rule IDs for:
- raw font sizes;
- line-height mismatch;
- random spacing;
- card spam;
- repeated generic card anatomy;
- mixed icon styles;
- non-SVG UI icons;
- icon-size/weight inconsistency;
- excessive radius/elevation;
- oversized headings;
- missing mobile adaptation;
- decorative visual noise.

## Consequences

### Positive

- generated interfaces have a coherent visual grammar;
- micro-decisions are reusable and testable;
- design drift is detected before code generation;
- the same rules can guide AI generation and human editing.

### Negative

- adds a visual-governance layer;
- heuristics require tuning and may create false positives;
- products with unusual visual languages need explicit strategy overrides.

## Revisit conditions

Revisit when:
- product-specific brand systems become importable;
- multi-brand projects require scoped visual strategies;
- benchmark data shows false-positive lint rates are high;
- native platform adapters require distinct type/icon systems.
