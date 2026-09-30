# UIForge MCP Contract

## Goal

Expose UIForge design context to AI agents in a form that is:

- semantic;
- scoped;
- typed;
- deterministic;
- compact;
- versionable;
- safe to mutate.

The MCP server is not a raw database proxy.

## Resource model

### `ui://project`

Project metadata, schema version, active design system, target frameworks.

### `ui://screens`

Screen index with IDs, names, viewport metadata and short summaries.

### `ui://screen/{id}`

Semantic screen tree.

### `ui://component/{id}`

Component definition, variants, states and code mappings.

### `ui://tokens`

Resolved and source token definitions.

### `ui://assets`

Asset index and metadata.

### `ui://flow/{id}`

Prototype/user-flow graph.

## Read tools

### get_project

Returns project metadata and capabilities.

### get_screen

Returns semantic screen context. Must not dump irrelevant project data.

### get_layout_tree

Returns hierarchical layout and constraints.

### get_component

Returns one component definition.

### get_component_registry

Returns available components, variants and semantic descriptions.

### get_design_tokens

Supports category/name filtering.

### get_code_mapping

Returns framework-specific implementation mappings.

### get_responsive_rules

Returns viewport behavior.

### get_code_spec

Returns an implementation-oriented specification for a target framework.

### validate_design

Runs schema/design-system validation and returns structured findings.

## Mutation tools

Mutation is opt-in.

- create_screen
- update_screen
- create_component_instance
- update_node
- move_node
- update_token

Every mutation must:

1. authenticate;
2. authorize against project;
3. validate input;
4. check schema version;
5. enforce design-system rules;
6. be idempotent where possible;
7. record an audit event;
8. return the changed IDs and revision.

## Response envelope

MCP responses should include:

```json
{
  "schemaVersion": "uiforge.mcp/v1",
  "projectId": "proj_...",
  "revision": 42,
  "data": {},
  "warnings": []
}
```

## Context minimization

Never expose the entire project unless explicitly requested.

Prefer:

`screen → relevant components → relevant tokens → code mappings`

over:

`project → every node → every asset`

## Compatibility

MCP contracts are versioned independently from the UI Schema when necessary.

Breaking changes require:

- contract fixture;
- migration/compatibility note;
- integration test;
- updated examples.

## Security

Never return:

- API keys;
- service-role credentials;
- private storage URLs without authorization;
- unrelated tenant data;
- internal database details not needed by the agent.

Hosted MCP uses Streamable HTTP. Local development can use stdio. Current AI SDK guidance recommends HTTP for production MCP clients. citeturn1search2

## Agent prompt conventions

The server may expose optional prompts:

- `implement_screen`
- `review_screen`
- `fix_visual_mismatch`

Prompts must be thin orchestration helpers. They must not replace typed resources/tools.

The MCP protocol defines prompts, resources and tools as separate primitives with different control semantics. citeturn1search0
