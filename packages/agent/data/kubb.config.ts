import { adapterOas } from "@kubb/adapter-oas";
import { parserTs } from "@kubb/parser-ts";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { defineConfig } from "kubb";

export default defineConfig({
  root: ".",
  input: {
    path: "./openapi.yaml",
  },
  output: {
    path: "./src/gen",
    clean: true,
    write: false,
  },
  adapter: adapterOas({}),
  parsers: [parserTs],
  plugins: [
    pluginOas(),
    pluginTs({
      output: {
        path: "models",
      },
    }),
  ],
});
