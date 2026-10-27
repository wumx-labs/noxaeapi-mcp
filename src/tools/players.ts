import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

async function resolveUuid(
  client: { players: { resolve: (name: string) => Promise<{ uuid: string }> } },
  playerOrUuid: string,
): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerOrUuid)) {
    return playerOrUuid;
  }
  try {
    const res = await client.players.resolve(playerOrUuid);
    return res.uuid;
  } catch {
    return playerOrUuid;
  }
}

export function registerPlayerTools(server: McpServer): void {
  server.tool(
    "players_list_online",
    "List all players currently online on the Minecraft server (or proxy network), including usernames, UUIDs, ping, and health.",
    {},
    async () => {
      const session = getSession();
      try {
        if (session.isHub && session.hubClient) {
          const result = await session.hubClient.network.players();
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        const client = session.getClient();
        const players = await client.players.list();
        return {
          content: [{ type: "text", text: JSON.stringify(players, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list online players: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "players_get_info",
    "Get detailed stats, health, and info for a player (online or offline) by username or UUID.",
    {
      player: z.string().describe("Player username or UUID"),
    },
    async ({ player }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        const [info, stats] = await Promise.allSettled([
          client.players.get(uuid),
          client.players.getStats(uuid),
        ]);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  playerInfo: info.status === "fulfilled" ? info.value : null,
                  stats: stats.status === "fulfilled" ? stats.value : null,
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
              text: `Failed to get player info for '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "players_kick",
    "Kick an online player from the Minecraft server.",
    {
      player: z.string().describe("Player username or UUID to kick"),
      reason: z.string().optional().describe("Kick reason displayed to the player"),
    },
    async ({ player, reason }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        await client.players.kick(uuid, reason);
        return {
          content: [
            {
              type: "text",
              text: `Successfully kicked player '${player}'${reason ? ` for reason: ${reason}` : ""}.`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to kick player '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "players_ban",
    "Ban a player from the Minecraft server.",
    {
      player: z.string().describe("Player username or UUID to ban"),
      reason: z.string().optional().describe("Ban reason"),
      expiry: z.string().optional().describe("ISO-8601 expiry date for temp bans (e.g. '2026-12-31T23:59:59Z'). Omit for permanent ban."),
    },
    async ({ player, reason, expiry }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        await client.players.ban(uuid, reason, expiry);
        return {
          content: [
            {
              type: "text",
              text: `Successfully banned player '${player}'${expiry ? ` until ${expiry}` : " permanently"}.`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to ban player '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "players_unban",
    "Unban a previously banned player.",
    {
      player: z.string().describe("Player username or UUID to unban"),
    },
    async ({ player }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        await client.players.unban(uuid);
        return {
          content: [{ type: "text", text: `Successfully unbanned player '${player}'.` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to unban player '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "players_set_gamemode",
    "Change the gamemode of an online player (survival, creative, adventure, spectator).",
    {
      player: z.string().describe("Player username or UUID"),
      gamemode: z.enum(["survival", "creative", "adventure", "spectator"]).describe("Gamemode to set"),
    },
    async ({ player, gamemode }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        await client.players.setGamemode(uuid, gamemode);
        return {
          content: [{ type: "text", text: `Successfully set gamemode of '${player}' to ${gamemode}.` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to set gamemode: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
