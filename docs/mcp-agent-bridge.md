# UIForge MCP Agent Bridge

UIForge exposes its canonical UI Schema and Agent Tool Registry through an MCP-compatible Streamable HTTP endpoint.

## Architecture

```text
OpenCode / Codex / Claude / custom MCP client
                    │ MCP JSON-RPC over HTTP
                    ▼
          /api/mcp + Bearer session token
                    │
             MCP JSON-RPC adapter
                    │
             Agent Tool Registry
                    │
        ┌───────────┴───────────┐
        │                       │
      READ                  MUTATION
        │                       │
 UIForge Schema          dryRun=true only
                                │
                         Agent Proposal
                                │
                       User Apply / Reject
```

The bridge does not expose arbitrary filesystem, shell, database, or direct document mutation.

## Connect from the UI

Open Design Agent → ⚙ AI → MCP Bridge → Create MCP bridge.

UIForge creates a short-lived in-memory bridge session and shows an OpenCode-compatible configuration. The browser keeps the token in React state; it is not written to the UI document or local storage.

The current document and selection are synchronized to the server session while the bridge is active.

## OpenCode

OpenCode supports remote MCP servers with type `remote`, an absolute URL, and optional headers.

```json
{
  "mcp": {
    "servers": {
      "uiforge": {
        "type": "remote",
        "url": "https://YOUR-UIFORGE-HOST/api/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Bearer YOUR_UIFORGE_BRIDGE_TOKEN"
        }
      }
    }
  }
}
```

Do not commit the token to source control. Prefer an environment-backed header when your MCP client supports it.

## MCP capabilities

### Tools

All registered UIForge semantic tools are exposed:

- `read_project`
- `read_screen`
- `read_node`
- `search_nodes`
- `inspect_selection`
- `validate_ui`
- `create_node`
- `update_node`
- `delete_node`
- `move_node`
- `set_style`
- `set_token`
- `set_layout`
- `set_responsive_rule`
- `create_component`

### Resources

- `uiforge://document`
- `uiforge://selection`

### Mutation safety

Every mutation call arriving through MCP is forced to `dryRun=true`, even if the client sends `false`.

An external agent can propose a design change, but cannot silently commit it. UIForge's existing proposal engine remains the authority for Apply/Reject and stale-revision checks.

## Supported clients

The bridge is transport-level MCP, so it is not tied to a particular model provider. Any MCP client capable of Streamable HTTP can consume it.

This includes OpenCode, Codex-compatible MCP clients, Claude-compatible MCP clients, VS Code/Cursor-style MCP integrations, and custom MCP clients.

## Session model

The current MVP stores bridge sessions in server memory. The browser pushes document revisions to the bound session after semantic changes.

For production multi-instance deployment, replace this in-memory store with a shared session store and add expiring/revocable credentials.

## Security notes

- Bridge tokens are bearer credentials.
- Treat them like API keys.
- Do not paste them into Git commits, issue comments, screenshots, or public logs.
- MCP calls are scoped to the bound UIForge document.
- Mutation tools are always proposal-only.
- AI provider API keys are unrelated to MCP bridge credentials and are never forwarded through MCP.
