# ADR-004 — UI Schema v1 as the canonical semantic UI contract

## Context

UIForge needs a durable representation that can be consumed by the editor, renderer, AI pipeline, MCP and code generation without making any one projection the persistence model. tldraw records and DOM output contain implementation/editor details rather than the complete semantic product specification.

## Decision

Adopt `uiforge.schema/v1` as the versioned canonical UI representation.

The schema owns:
- stable document/screen/node/asset identifiers;
- screen and node hierarchy;
- semantic layout modes and constraints;
- content and token references;
- component registry instances;
- responsive rules;
- accessibility metadata;
- asset references;
- revision metadata;
- interaction metadata limited to the identity/semantics needed to reference Experience Graph participants.

The Product Experience Graph remains the owner of flows, journeys, transitions, conditions and navigation semantics. UI Schema never stores a competing flow model.

Mutations are represented as serializable typed commands. Schema validation occurs before and after command application. Serialization canonicalizes object keys for deterministic artifacts and replay tests.

Editor coordinates are optional projection metadata only.

## Alternatives

1. Persist tldraw records as the canonical model — rejected because editor implementation details would become the domain contract.
2. Persist DOM/React trees — rejected because runtime markup is not a stable semantic design model.
3. Store navigation directly in UI Schema — rejected because it duplicates the Product Experience Graph.

## Consequences

- Editor, renderer, MCP and codegen can evolve independently of tldraw.
- Stable IDs can be referenced by the future Experience Graph without embedding graph semantics here.
- Typed commands provide a common mutation/audit/replay boundary.
- Schema migrations become explicit versioned contracts.

## Revisit conditions

Revisit only if a later schema version cannot represent required semantic design information without coupling to an editor, renderer or provider.
