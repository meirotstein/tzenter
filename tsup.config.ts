import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/api/onSchedule.ts", "src/api/onMessage.ts"],
  format: ["esm"],
  dts: true,
  outDir: "public",
});
