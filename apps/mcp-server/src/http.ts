import { createServer } from "node:http";
import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler,
} from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { createMcpServer } from "./server";

const handler = createMcpHandler(() => createMcpServer(), {
  legacy: "stateless",
});
const nodeHandler = toNodeHandler(handler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

const server = createServer(async (req, res) => {
  if (req.url !== "/mcp") {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }
  if (!validateHost(req, res)) return;
  if (!(await validateOrigin(req, res))) return;
  await nodeHandler(req, res);
});

const port = Number(process.env.PORT ?? 3100);
server.listen(port, "127.0.0.1", () => {
  process.stderr.write(
    `UIForge MCP HTTP listening on http://127.0.0.1:${port}/mcp\n`,
  );
});
