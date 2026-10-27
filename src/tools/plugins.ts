import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

export function registerPluginTools(server: McpServer): void {
  server.tool(
    "plugins_list",
    "List all plugins installed on the Minecraft server and their status (enabled/disabled, version).",
    {},
    async () => {
      const session = getSession();
      try {
        const client = session.getClient();
        const plugins = await client.plugins.list();
        return {
          content: [{ type: "text", text: JSON.stringify(plugins, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list plugins: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "plugins_get_info",
    "Get detailed metadata and description for a specific plugin installed on the server.",
    {
      pluginName: z.string().describe("Name of the plugin, e.g. 'LuckPerms', 'Essentials'"),
    },
    async ({ pluginName }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const plugin = await client.plugins.get(pluginName);
        return {
          content: [{ type: "text", text: JSON.stringify(plugin, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get info for plugin '${pluginName}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
