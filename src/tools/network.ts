import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

export function registerNetworkTools(server: McpServer): void {
  server.tool(
    "network_status_all",
    "Get live status, player count, and health/TPS of all Minecraft server nodes registered in the network hub or aggregator.",
    {},
    async () => {
      const session = getSession();
      try {
        let result: unknown;
        if (session.isHub && session.hubClient) {
          result = await session.hubClient.network.statusAll();
        } else if (session.singleClient) {
          result = await session.singleClient.network.statusAll();
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to fetch network status: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "network_node_status",
    "Get detailed status and health of a specific server node in the network by its nodeId.",
    {
      nodeId: z.string().describe("The ID of the server node, e.g. 'lobby', 'survival-1'"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        let result: unknown;
        if (session.isHub && session.hubClient) {
          result = await session.hubClient.network.status(nodeId);
        } else if (session.singleClient) {
          result = await session.singleClient.network.status(nodeId);
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get status for node '${nodeId}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "network_broadcast",
    "Broadcast a chat announcement across all servers in the network.",
    {
      message: z.string().describe("The message text to broadcast to all players in the network"),
    },
    async ({ message }) => {
      const session = getSession();
      try {
        let result: unknown;
        if (session.isHub && session.hubClient) {
          result = await session.hubClient.network.broadcast(message);
        } else if (session.singleClient) {
          result = await session.singleClient.network.broadcast(message);
        }
        return {
          content: [
            {
              type: "text",
              text: `Network broadcast sent successfully: ${JSON.stringify(result ?? "OK")}`,
            },
          ],
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
    "network_find_player",
    "Find which server node a player is currently playing on in the proxy/network.",
    {
      player: z.string().describe("Username or UUID of the player"),
    },
    async ({ player }) => {
      const session = getSession();
      try {
        let result: unknown;
        if (session.isHub && session.hubClient) {
          result = await session.hubClient.network.find(player);
        } else {
          throw new Error("network_find_player requires a Velocity Network Hub connection.");
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to find player '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "network_send_player",
    "Send/transfer a player from their current server to a target server node.",
    {
      player: z.string().describe("Username or UUID of the player"),
      destinationServer: z.string().describe("Destination server name, e.g. 'survival', 'lobby'"),
    },
    async ({ player, destinationServer }) => {
      const session = getSession();
      try {
        if (!session.isHub || !session.hubClient) {
          throw new Error("network_send_player requires a Velocity Network Hub connection.");
        }
        const result = await session.hubClient.network.sendPlayer(player, destinationServer);
        return {
          content: [
            {
              type: "text",
              text: `Player ${player} sent to ${destinationServer}: ${JSON.stringify(result ?? "OK")}`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to send player: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
