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

export function registerRankForgeTools(server: McpServer): void {
  // ── GET player stats ──────────────────────────────────────────────────────
  server.tool(
    "rankforge_get_player_stats",
    "Get full RankForge PvP stats for a player: points, current tier, next tier, kills, deaths, K/D ratio, and daily kills. Accepts UUID or player name.",
    {
      player: z
        .string()
        .describe("Player UUID or player name"),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID when connected via Velocity hub"),
    },
    async ({ player, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const uuid = await resolveUuid(client as any, player);
        const stats = await (client as any).rankforge.getPlayerStats(uuid);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(stats, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get RankForge stats for '${player}': ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ── GET points ────────────────────────────────────────────────────────────
  server.tool(
    "rankforge_get_points",
    "Get current RankForge points for a player. Accepts UUID or player name.",
    {
      player: z.string().describe("Player UUID or player name"),
      nodeId: z.string().optional().describe("Target server node ID when connected via Velocity hub"),
    },
    async ({ player, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const uuid = await resolveUuid(client as any, player);
        const result = await (client as any).rankforge.getPoints(uuid);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get points for '${player}': ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ── SET points ────────────────────────────────────────────────────────────
  server.tool(
    "rankforge_set_points",
    "Set RankForge points for a player to an exact amount. This will override their current points. Accepts UUID or player name.",
    {
      player: z.string().describe("Player UUID or player name"),
      amount: z.number().describe("Exact points value to set"),
      nodeId: z.string().optional().describe("Target server node ID when connected via Velocity hub"),
    },
    async ({ player, amount, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const uuid = await resolveUuid(client as any, player);
        const result = await (client as any).rankforge.setPoints(uuid, amount);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to set points for '${player}': ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ── ADD points ────────────────────────────────────────────────────────────
  server.tool(
    "rankforge_add_points",
    "Add RankForge points to a player. Accepts UUID or player name.",
    {
      player: z.string().describe("Player UUID or player name"),
      amount: z.number().describe("Number of points to add"),
      nodeId: z.string().optional().describe("Target server node ID when connected via Velocity hub"),
    },
    async ({ player, amount, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const uuid = await resolveUuid(client as any, player);
        const result = await (client as any).rankforge.addPoints(uuid, amount);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to add points for '${player}': ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ── REMOVE points ─────────────────────────────────────────────────────────
  server.tool(
    "rankforge_remove_points",
    "Remove (deduct) RankForge points from a player. Accepts UUID or player name.",
    {
      player: z.string().describe("Player UUID or player name"),
      amount: z.number().describe("Number of points to remove"),
      nodeId: z.string().optional().describe("Target server node ID when connected via Velocity hub"),
    },
    async ({ player, amount, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const uuid = await resolveUuid(client as any, player);
        const result = await (client as any).rankforge.removePoints(uuid, amount);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to remove points for '${player}': ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ── GET tiers ─────────────────────────────────────────────────────────────
  server.tool(
    "rankforge_list_tiers",
    "List all registered PvP tiers from RankForge (name, minPoints, maxPoints, etc.).",
    {
      nodeId: z.string().optional().describe("Target server node ID when connected via Velocity hub"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const tiers = await (client as any).rankforge.getTiers();
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(tiers, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list RankForge tiers: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ── GET top ───────────────────────────────────────────────────────────────
  server.tool(
    "rankforge_get_top",
    "Get the top players ranked by RankForge points (PvP leaderboard). Returns rank, UUID, name, points, and tier.",
    {
      limit: z
        .number()
        .optional()
        .describe("Number of top players to return (default 10, max 100)"),
      nodeId: z.string().optional().describe("Target server node ID when connected via Velocity hub"),
    },
    async ({ limit = 10, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const top = await (client as any).rankforge.getTop(limit);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(top, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get RankForge top: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );

  // ── SAVE ──────────────────────────────────────────────────────────────────
  server.tool(
    "rankforge_save",
    "Trigger an async save of all RankForge player data to disk/database.",
    {
      nodeId: z.string().optional().describe("Target server node ID when connected via Velocity hub"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const result = await (client as any).rankforge.save();
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to trigger RankForge save: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }
    },
  );
}
