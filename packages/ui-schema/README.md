# UI Schema v1

UI Schema is UIForge's canonical, versioned representation of screen and node semantics. It is independent of tldraw, React, DOM output and AI providers.

Schema identifier: `uiforge.schema/v1`.

## Boundaries

- UI Schema owns screens, nodes, semantic layout, content, token references, component instances, responsive/accessibility metadata, assets and revision metadata.
- Product Experience Graph owns journeys, flows and transitions. UI Schema only exposes stable screen/node references and interaction metadata.
- Editor coordinates are optional metadata for projections; they are never the semantic layout contract.
- Mutations use typed serializable commands so editor, AI and future collaboration can replay changes without coupling to a canvas format.

## Public API

The package exports:

- domain types and stable IDs;
- runtime validation;
- typed command application;
- deterministic serialization;
- schema-version checks;
- migration interfaces;
- dashboard/login/mobile-list fixtures.

Unknown schema versions fail explicitly. Stable IDs are mandatory.
