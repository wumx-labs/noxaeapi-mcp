import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

async function resolveUuid(
  client: { players: { resolve: (name: string) => Promise<{ uuid: string }> } },
  playerOrUuid: string,
): Promise<{ uuid: string; name: string }> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerOrUuid)) {
    return { uuid: playerOrUuid, name: playerOrUuid };
  }
  try {
    const res = await client.players.resolve(playerOrUuid);
    return { uuid: res.uuid, name: playerOrUuid };
  } catch {
    return { uuid: playerOrUuid, name: playerOrUuid };
  }
}

export function registerServerTools(server: McpServer): void {
  server.tool(
    "server_get_status",
    "Get TPS (1m, 5m, 15m), CPU load, memory/RAM usage, uptime, and version of the Minecraft server.",
    {
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (if connected via Velocity hub, e.g. 'survival', 'lobby')"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient && nodeId) {
          const [info, tps, health] = await Promise.allSettled([
            session.hubClient.network.forward(nodeId, "GET", "server"),
            session.hubClient.network.forward(nodeId, "GET", "server/tps"),
            session.hubClient.network.forward(nodeId, "GET", "server/health"),
          ]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    nodeId,
                    info: info.status === "fulfilled" ? info.value : null,
                    tps: tps.status === "fulfilled" ? tps.value : null,
                    health: health.status === "fulfilled" ? health.value : null,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const client = session.getClient();
        const [info, tps, health] = await Promise.allSettled([
          client.server.info(),
          client.server.tps(),
          client.server.health(),
        ]);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  info: info.status === "fulfilled" ? info.value : null,
                  tps: tps.status === "fulfilled" ? tps.value : null,
                  health: health.status === "fulfilled" ? health.value : null,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get server status: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_dispatch_command",
    "Execute a Minecraft console command on the server (e.g. 'say Hello', 'whitelist on', 'gamemode creative Steve').",
    {
      command: z.string().describe("The console command to execute, without leading slash"),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (if on Velocity hub, e.g. 'survival', 'lobby')"),
    },
    async ({ command, nodeId }) => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient && nodeId) {
          const result = await session.hubClient.network.forward(nodeId, "POST", "server/exec", {
            body: { command },
            form: true,
          });
          return {
            content: [
              {
                type: "text",
                text: `Command executed on [${nodeId}]: ${JSON.stringify(result ?? "Command dispatched successfully")}`,
              },
            ],
          };
        }

        const client = session.getClient();
        const result = await client.server.dispatchCommand(command);
        return {
          content: [
            {
              type: "text",
              text: `Command executed: ${JSON.stringify(result ?? "Command dispatched successfully")}`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to dispatch command: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_broadcast",
    "Broadcast a chat message to all players on the Minecraft server.",
    {
      message: z.string().describe("The message text to broadcast"),
      nodeId: z.string().optional().describe("Target server node ID (if on Velocity hub)"),
    },
    async ({ message, nodeId }) => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient && nodeId) {
          const result = await session.hubClient.network.forward(nodeId, "POST", "chat/broadcast", {
            body: { message },
            form: true,
          });
          return {
            content: [{ type: "text", text: `Broadcast sent to [${nodeId}]: ${JSON.stringify(result ?? "OK")}` }],
          };
        }

        const client = session.getClient();
        const result = await client.server.broadcast(message);
        return {
          content: [{ type: "text", text: `Broadcast sent: ${JSON.stringify(result ?? "OK")}` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to broadcast message: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_get_whitelist",
    "Get the current list of whitelisted players.",
    {
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient && nodeId) {
          const result = await session.hubClient.network.forward(nodeId, "GET", "server/whitelist");
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        const client = session.getClient();
        const result = await client.server.getWhitelist();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get whitelist: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_whitelist_add",
    "Add a player to the server whitelist by username or UUID.",
    {
      player: z.string().describe("Player username or UUID to whitelist"),
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ player, nodeId }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const { uuid, name } = await resolveUuid(client, player);
        if (session.isHub && session.hubClient && nodeId) {
          await session.hubClient.network.forward(nodeId, "POST", "server/whitelist", {
            body: { uuid, name },
            form: true,
          });
          return {
            content: [{ type: "text", text: `Successfully whitelisted player '${player}' on [${nodeId}].` }],
          };
        }
        await client.server.addToWhitelist(uuid, name);
        return {
          content: [{ type: "text", text: `Successfully whitelisted player '${player}'.` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to add player to whitelist: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_whitelist_remove",
    "Remove a player from the server whitelist by username or UUID.",
    {
      player: z.string().describe("Player username or UUID to remove from whitelist"),
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ player, nodeId }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const { uuid } = await resolveUuid(client, player);
        if (session.isHub && session.hubClient && nodeId) {
          await session.hubClient.network.forward(nodeId, "DELETE", "server/whitelist", {
            query: { uuid },
          });
          return {
            content: [{ type: "text", text: `Successfully removed player '${player}' from whitelist on [${nodeId}].` }],
          };
        }
        await client.server.removeFromWhitelist(uuid);
        return {
          content: [{ type: "text", text: `Successfully removed player '${player}' from whitelist.` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to remove player from whitelist: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_get_ops",
    "List all server operators (OPs).",
    {
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient && nodeId) {
          const result = await session.hubClient.network.forward(nodeId, "GET", "server/ops");
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        const client = session.getClient();
        const result = await client.server.getOps();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get operators: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_op_player",
    "Grant operator (OP) status to a player.",
    {
      player: z.string().describe("Player username or UUID to promote to operator"),
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ player, nodeId }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const { uuid } = await resolveUuid(client, player);
        if (session.isHub && session.hubClient && nodeId) {
          await session.hubClient.network.forward(nodeId, "POST", "server/ops", {
            body: { playerUuid: uuid },
            form: true,
          });
          return {
            content: [{ type: "text", text: `Successfully granted OP status to '${player}' on [${nodeId}].` }],
          };
        }
        await client.server.opPlayer(uuid);
        return {
          content: [{ type: "text", text: `Successfully granted OP status to '${player}'.` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to OP player: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_deop_player",
    "Revoke operator (OP) status from a player.",
    {
      player: z.string().describe("Player username or UUID to demote from operator"),
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ player, nodeId }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const { uuid } = await resolveUuid(client, player);
        if (session.isHub && session.hubClient && nodeId) {
          await session.hubClient.network.forward(nodeId, "DELETE", "server/ops", {
            query: { playerUuid: uuid },
          });
          return {
            content: [{ type: "text", text: `Successfully revoked OP status from '${player}' on [${nodeId}].` }],
          };
        }
        await client.server.deopPlayer(uuid);
        return {
          content: [{ type: "text", text: `Successfully revoked OP status from '${player}'.` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to de-OP player: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_get_logs",
    "Tail recent console log lines from the server.",
    {
      lines: z.number().optional().describe("Number of log lines to retrieve (default 50)"),
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ lines, nodeId }) => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient && nodeId) {
          const result = await session.hubClient.network.forward(nodeId, "GET", "server/logs", {
            query: { lines: lines ?? 50 },
          });
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        const client = session.getClient();
        const result = await client.server.getLogs(lines ?? 50);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get server logs: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_restart",
    "Restart the Minecraft server process (requires privileged write key).",
    {
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient && nodeId) {
          await session.hubClient.network.forward(nodeId, "POST", "server/restart");
          return { content: [{ type: "text", text: `Server [${nodeId}] restart initiated.` }] };
        }
        const client = session.getClient();
        await client.server.restart();
        return { content: [{ type: "text", text: "Server restart initiated." }] };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to restart server: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_ban_ip",
    "Ban an IP address from connecting to the server.",
    {
      ip: z.string().describe("The IP address to ban"),
      reason: z.string().optional().describe("Reason for banning this IP"),
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ ip, reason, nodeId }) => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient && nodeId) {
          await session.hubClient.network.forward(nodeId, "POST", "server/ban-ip", {
            body: { ip, reason },
            form: true,
          });
          return { content: [{ type: "text", text: `Successfully banned IP '${ip}' on [${nodeId}].` }] };
        }
        const client = session.getClient();
        await client.server.banIp(ip, reason);
        return { content: [{ type: "text", text: `Successfully banned IP '${ip}'.` }] };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to ban IP: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "server_tell_player",
    "Send a private whisper/message to a specific player.",
    {
      player: z.string().describe("Player username or UUID to message"),
      message: z.string().describe("The private message content"),
      nodeId: z.string().optional().describe("Target server node ID"),
    },
    async ({ player, message, nodeId }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const { uuid } = await resolveUuid(client, player);
        if (session.isHub && session.hubClient && nodeId) {
          await session.hubClient.network.forward(nodeId, "POST", "chat/tell", {
            body: { playerUuid: uuid, message },
            form: true,
          });
          return { content: [{ type: "text", text: `Message sent to '${player}' on [${nodeId}].` }] };
        }
        await client.server.tell(uuid, message);
        return { content: [{ type: "text", text: `Message sent to '${player}'.` }] };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to send message: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
