# UIForge MCP server

Issue #11 exposes UIForge semantic design context to external coding agents without exposing raw canvas/database records.

## Surface

- Resources: project, screens, screen, component, tokens, assets, flows, flow, journey, screen connections.
- Read-only tools: get_project, get_screen, get_layout_tree, get_component, get_component_registry, get_design_tokens, get_code_mapping, get_responsive_rules, get_code_spec, get_flows, get_flow, get_user_journey, get_transitions, get_screen_connections, get_navigation_map, validate_design, validate_flow.
- Local stdio transport.
- Streamable HTTP at /mcp.
- Versioned response envelope: uiforge.mcp/v1.
- Every read tool is annotated readOnlyHint: true.

The server uses a ProjectProvider seam. The committed sample provider is deterministic and is only a contract/evidence fixture. Production persistence/auth wiring belongs to #17; Experience Graph canonicalization belongs to #21; code specification is owned by #13.

## Security boundary

The server never returns database internals, secrets, credentials, raw tldraw records, or arbitrary project data. Every read operation requires an explicit projectId scope except the fixed sample-project resource used by contract tests.

Remote HTTP uses the current MCP Streamable HTTP entry point and localhost Host/Origin protections. Public deployment must add real authorization before exposing non-local projects.

## Context discipline

The server intentionally exposes scoped projections instead of get_everything. get_flows returns summaries; get_flow returns one complete flow; get_navigation_map returns graph edges without screen payloads. This keeps agent context bounded and makes semantic navigation explicit.

## Dependency seam

Issue #21 is still open, so the sample provider carries a temporary flow projection matching the MCP public contract. This is isolated behind ProjectProvider so #21 can replace the fixture with the canonical Experience Graph without changing the MCP surface.

## Run

pnpm --filter @uiforge/mcp-server stdio
pnpm --filter @uiforge/mcp-server http

HTTP endpoint: http://127.0.0.1:3100/mcp


## Write capability boundary

Issue #12 adds opt-in mutation tools:

- `create_screen`
- `update_screen`
- `create_component_instance`
- `update_node`
- `move_node`
- `update_token`

Mutation tools are **not registered** for read-only connections. A caller must be authorized by the server with both a project scope and the required capability (`design:write`, `design:structure`, or `design:tokens`). Client-provided capability claims are never trusted.

Every mutation requires:

1. explicit project scope;
2. base schema revision;
3. idempotency key;
4. server authorization;
5. semantic/UI/token validation before commit.

Rejected stale revisions, cross-project access, malformed commands, capability failures and validation failures do not commit. Every accepted, replayed or rejected mutation creates an audit event. Mutation responses contain operation, revision, replay state, audit event ID and validation findings.

The current implementation uses a `MutableProjectProvider` seam and deterministic in-memory persistence for contract tests. Production persistence/authentication remains an integration boundary; the MCP contract does not expose database credentials or internals.
