import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

export function registerWorldTools(server: McpServer): void {
  server.tool(
    "worlds_list",
    "List all worlds loaded on the Minecraft server (including name, environment, difficulty, time, and weather).",
    {},
    async () => {
      const session = getSession();
      try {
        const client = session.getClient();
        const worlds = await client.worlds.list();
        return {
          content: [{ type: "text", text: JSON.stringify(worlds, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list worlds: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "worlds_set_time",
    "Set the in-game time of a world (0 = day, 6000 = noon, 13000 = night, 18000 = midnight).",
    {
      worldUuid: z.string().describe("World UUID or name"),
      time: z.number().min(0).max(24000).describe("Time in ticks (0-24000)"),
    },
    async ({ worldUuid, time }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        await client.worlds.setTime(worldUuid, time);
        return {
          content: [{ type: "text", text: `Successfully set world '${worldUuid}' time to ${time} ticks.` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to set world time: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "worlds_set_weather",
    "Set the weather condition in a world (clear, rain, thunder).",
    {
      worldUuid: z.string().describe("World UUID or name"),
      weather: z.enum(["clear", "rain", "thunder"]).describe("Weather state"),
    },
    async ({ worldUuid, weather }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        await client.worlds.setWeather(worldUuid, weather);
        return {
          content: [{ type: "text", text: `Successfully set world '${worldUuid}' weather to ${weather}.` }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to set weather: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "worlds_get_entities",
    "Get count and breakdown of entities (mobs, items, players) currently loaded in a world.",
    {
      worldUuid: z.string().describe("World UUID or name"),
    },
    async ({ worldUuid }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const result = await client.worlds.getEntities(worldUuid);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get world entities: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
