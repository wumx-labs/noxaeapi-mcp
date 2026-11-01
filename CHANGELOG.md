# Changelog — @wumx-labs/noxaeapi-mcp

All notable changes to the `@wumx-labs/noxaeapi-mcp` package will be documented in this file.

---

## [1.0.2] - 2026-11-01

### ⚔️ Dedicated RankForge MCP Tools & Sysadmin Decision Logic
* **Added Hand-Crafted RankForge Tools:**
  - `rankforge_get_player_stats`: Fetch player points, tier, next tier, kills, deaths, K/D, and daily kills.
  - `rankforge_get_points`: Query raw points for a player.
  - `rankforge_set_points`: Set exact points for a player.
  - `rankforge_add_points`: Add points to a player.
  - `rankforge_remove_points`: Deduct points from a player.
  - `rankforge_list_tiers`: Query all registered server tiers with threshold metadata.
  - `rankforge_get_top`: Get top players by points leaderboard.
  - `rankforge_save`: Trigger async save of player records.
* **Automatic Name Resolution & Proxy Routing:**
  - All player-facing tools accept player names or UUIDs with automatic local UUID resolution.
  - Full Velocity network proxy support via `nodeId` parameter.
* **Sysadmin Decision Tree:**
  - Updated `minecraft_sysadmin` prompt with guidelines for PvP tier management and leaderboard routing.

---

## [1.0.1] - 2026-10-27

### 🧠 Sysadmin Context & Dynamic Auto-Registration
* **Intelligent MCP System Prompt (`minecraft_sysadmin`):**
  - Integrated guidelines and decision matrices for AI agents operating Minecraft servers.
* **100% Dynamic SDK Auto-Registration:**
  - Added `auto-register.ts` to automatically discover and expose all SDK module methods as MCP tools.
* **Cleaned Noise Patterns:**
  - Filtered internal plugin placeholder noise from leaderboard tool listings.
