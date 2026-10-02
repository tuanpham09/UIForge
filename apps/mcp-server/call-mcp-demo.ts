import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

async function main() {
  const client = new Client(
    { name: "uiforge-test-runner", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );

  console.log("=================================================");
  console.log(
    "🔗 Connecting to UIForge MCP Server at http://127.0.0.1:3100/mcp",
  );
  console.log("=================================================");

  await client.connect(
    new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3100/mcp")),
  );
  console.log("✅ Successfully connected via Streamable HTTP Transport!\n");

  // 1. List all available tools
  const tools = await client.listTools();
  console.log(`🛠️  Registered MCP Tools (${tools.tools.length}):`);
  for (const t of tools.tools) {
    console.log(`  • ${t.name.padEnd(24)} : ${t.description}`);
  }

  // 2. Call get_project
  console.log("\n-------------------------------------------------");
  console.log("📦 Tool Call: get_project({ projectId: 'sample-project' })");
  console.log("-------------------------------------------------");
  const project = await client.callTool({
    name: "get_project",
    arguments: { projectId: "sample-project" },
  });
  console.log(
    JSON.stringify(project.structuredContent ?? project.content, null, 2),
  );

  // 3. Call get_screen
  console.log("\n-------------------------------------------------");
  console.log(
    "📱 Tool Call: get_screen({ projectId: 'sample-project', screenId: 'screen.dashboard' })",
  );
  console.log("-------------------------------------------------");
  const screen = await client.callTool({
    name: "get_screen",
    arguments: { projectId: "sample-project", screenId: "screen.dashboard" },
  });
  console.log(
    JSON.stringify(screen.structuredContent ?? screen.content, null, 2),
  );

  // 4. Call get_navigation_map
  console.log("\n-------------------------------------------------");
  console.log(
    "🗺️  Tool Call: get_navigation_map({ projectId: 'sample-project' })",
  );
  console.log("-------------------------------------------------");
  const navMap = await client.callTool({
    name: "get_navigation_map",
    arguments: { projectId: "sample-project" },
  });
  console.log(
    JSON.stringify(navMap.structuredContent ?? navMap.content, null, 2),
  );

  // 5. Call get_design_tokens
  console.log("\n-------------------------------------------------");
  console.log(
    "🎨 Tool Call: get_design_tokens({ projectId: 'sample-project' })",
  );
  console.log("-------------------------------------------------");
  const tokens = await client.callTool({
    name: "get_design_tokens",
    arguments: { projectId: "sample-project" },
  });
  const tokenData = (tokens.structuredContent ?? tokens.content) as
    | { data?: { tokens?: Record<string, unknown> } }
    | undefined;
  console.log(
    "Token categories retrieved:",
    Object.keys(tokenData?.data?.tokens ?? {}),
  );

  // 6. Call validate_design
  console.log("\n-------------------------------------------------");
  console.log("✅ Tool Call: validate_design({ projectId: 'sample-project' })");
  console.log("-------------------------------------------------");
  const validation = await client.callTool({
    name: "validate_design",
    arguments: { projectId: "sample-project" },
  });
  console.log(
    JSON.stringify(validation.structuredContent ?? validation.content, null, 2),
  );

  await client.close();
  console.log("\n🏁 Finished MCP tool invocation successfully!");
}

main().catch((err) => {
  console.error("❌ Error invoking MCP:", err);
  process.exit(1);
});
