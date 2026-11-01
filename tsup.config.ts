import { defineConfig } from "tsup";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  target: "node18",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
  sourcemap: false,
  dts: true,
  splitting: false,
  define: {
    __MCP_NAME__: JSON.stringify(pkg.name),
    __MCP_VERSION__: JSON.stringify(pkg.version),
  },
});
