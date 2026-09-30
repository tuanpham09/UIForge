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

The MCP server is not a raw database proxy. It is a semantic projection of Product Intent, Design Strategy, UI Schema and Product Experience Graph. The latter two remain the canonical persisted design contracts.

## Resource model

### `ui://project`

Project metadata, schema version, active design system, target frameworks.

### `ui://design-strategy`

Current validated Design Strategy, including selected skill IDs, provenance, information architecture, navigation strategy, screen archetypes, interaction/responsive/accessibility requirements, anti-patterns and Color Strategy reference.

### `ui://color-strategy`

Current project-wide Color Strategy: primary/secondary/accent roles, semantic surface/foreground/status roles, tonal scales, light/dark mappings, chart palette and validation findings.

### `ui://design-skills`

Scoped index of design skills relevant to the project/strategy. Do not expose the entire registry by default.

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

### `ui://flows`

Flow index with names, starting points and summaries.

### `ui://flow/{id}`

Semantic user-flow graph with transitions and validation findings.

### `ui://journey/{id}`

User journey context across one or more flows.

### `ui://screen/{id}/connections`

Incoming/outgoing transitions for one screen.

## Read tools

### get_project

Returns project metadata and capabilities.

### get_design_strategy

Returns the current Design Strategy and selected-skill provenance.

### get_color_strategy

Returns the validated project-wide Color Strategy and semantic palette roles.

### get_design_skills

Returns scoped skill definitions or summaries needed for the requested design/code task.

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

### get_flows

Returns a scoped flow index.

### get_flow

Returns one semantic flow graph.

### get_user_journey

Returns a user journey and its participating flows/screens.

### get_transitions

Returns filtered semantic transitions.

### get_screen_connections

Returns incoming/outgoing connections for a screen.

### get_navigation_map

Returns a compact navigation graph for the requested project/flow.

### validate_design

Runs schema/design-system validation and returns structured findings.

### validate_flow

Runs Experience Graph validation and reports broken, unreachable or ambiguous connections.

## Mutation tools

Mutation is opt-in.

- create_screen
- update_screen
- create_component_instance
- update_node
- move_node
- update_token
- create_transition
- update_transition
- delete_transition

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

`design strategy → color strategy → relevant skills/patterns → flow → relevant screens → transitions → relevant components → relevant tokens → code mappings`

For a coding task, agents should receive the relevant Design Strategy requirements plus both the visual contract and behavioral contract so implementation does not silently omit design rationale, navigation or interaction.

over:

`project → every node → every asset`

## Flow semantics

A transition response must expose explicit `from`, `trigger`, `action`, `to` and optional `condition`/`animation` fields. Do not require an agent to infer navigation from coordinates, labels or prototype wire records.

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

Hosted MCP uses the current Streamable HTTP transport. Local development can use stdio. Use the current MCP TypeScript SDK v2 packages (`@modelcontextprotocol/server`, `@modelcontextprotocol/client`) rather than the legacy monolithic SDK package.

## Agent prompt conventions

The server may expose optional prompts:

- `implement_screen`
- `review_screen`
- `fix_visual_mismatch`

Prompts must be thin orchestration helpers. They must not replace typed resources/tools.

The MCP protocol defines prompts, resources and tools as separate primitives with different control semantics.


## Current protocol baseline

As of the September 2026 project baseline, the MCP TypeScript SDK v2 is the stable line implementing the 2026-07-28 specification. The SDK is split into server/client packages and the modern protocol has updated HTTP/session behavior. Keep protocol-version assumptions isolated in the MCP adapter so the UI Schema and business logic remain stable.

## Official references

- MCP specification: https://modelcontextprotocol.io/specification/
- MCP TypeScript SDK v2: https://github.com/modelcontextprotocol/typescript-sdk
- Streamable HTTP transport: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/draft/basic/transports/streamable-http.mdx
- AI SDK MCP: https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools
