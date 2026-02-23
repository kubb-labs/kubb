export default defineNitroConfig({
  srcDir: "server",
  debug: false,
  serveStatic: false,
  compatibilityDate: "2026-02-22",
  ignore: ["**/*.test.ts", "**/*.spec.ts"],
  nodeModulesDirs: [
    "./node_modules", // Local modules
    "../../node_modules", // Root modules (in a monorepo)
  ],
  routeRules: {
    "/**": {
      cors: false,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Expose-Headers": "*",
      },
    },
  },
});
