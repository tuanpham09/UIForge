# @uiforge/agent-runtime

The Agent Runtime is the provider- and UI-independent execution boundary for UIForge agents.

## Flow

```
Agent / future Design Chat
        ↓
AgentRuntime
        ↓
AgentToolRegistry
        ↓
semantic UI tools
        ↓
UI Schema
        ↓
canvas projection
```

The runtime intentionally does not depend on React, tldraw, an LLM provider, or MCP transport.

## Extension points

- Add model adapters that produce `AgentToolCall[]`.
- Add MCP adapters that expose remote capabilities as registered tools.
- Add semantic mutation tools through the existing UI Schema command layer.
- Subscribe to `AgentEvent` for chat/progress UI.

The first tool set is read-only so the agent contract can be validated before introducing autonomous mutations.
