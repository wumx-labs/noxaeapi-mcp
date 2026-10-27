# @wumx-labs/noxaeapi-mcp

Official **Model Context Protocol (MCP)** server for **NoxAeApi**.

Allows any AI Agent (**Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, **Cline**, **Antigravity**) to monitor and control your Minecraft servers and Velocity network hubs using natural language.

---

## ⚡ Features

* **Network Hub & Proxy Support (Velocity)**: Check all nodes status, TPS, broadcast to network, find players across proxy, transfer players between servers.
* **Server Management**: Real-time TPS (1m, 5m, 15m), RAM/memory usage, execute console commands, manage whitelists, and view bans.
* **Player Controls**: List online players with ping/health, player info & stats, kick, ban, unban, change gamemodes.
* **LuckPerms Integration**: Inspect player groups & permissions, grant/revoke permissions with expiry, assign primary groups.
* **Economy Management**: Check balances (Vault & multi-currency), pay, debit, and view top balance leaderboards.
* **World Controls**: List worlds, change time (`day`, `night`, ticks), adjust weather (`clear`, `rain`, `thunder`), and inspect loaded entities.
* **Plugin Insights**: Inspect installed plugins, enabled state, and versions.
* **Zero Configuration**: Automatically reads your active server profile from `~/.noxaeapi-cli/config.json`.

---

## 🚀 Setup & Usage

### 1. Claude Code (CLI)

Add directly using Claude CLI:
```bash
claude mcp add noxae -- node d:/Ainz-Project/NoxAeApi-ZZ/noxaeapi-mcp/dist/index.js
```
Or if installed globally:
```bash
claude mcp add noxae -- npx @wumx-labs/noxaeapi-mcp
```

### 2. Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "noxae": {
      "command": "node",
      "args": ["d:/Ainz-Project/NoxAeApi-ZZ/noxaeapi-mcp/dist/index.js"]
    }
  }
}
```

### 3. Cursor / Windsurf

Add a new MCP server in Settings:
* **Name**: `noxae`
* **Type**: `command`
* **Command**: `node d:/Ainz-Project/NoxAeApi-ZZ/noxaeapi-mcp/dist/index.js`

---

## ⚙️ Options & Flags

By default, `noxaeapi-mcp` automatically connects to your current active profile in `noxaeapi-cli`. You can also override it:

```bash
# Target a specific profile saved in noxaeapi-cli
node dist/index.js --profile my-survival

# Connect directly using URL and API Key
node dist/index.js --url http://127.0.0.1:8080 --key my-secret-key

# Connect to a Velocity Network Hub directly
node dist/index.js --url http://127.0.0.1:19135 --key my-hub-key --hub
```

Or via environment variables:
* `NOXAEAPI_PROFILE`
* `NOXAEAPI_BASE_URL`
* `NOXAEAPI_KEY`
* `NOXAEAPI_HUB=true`
