import process from "node:process";
import type { Config } from "@kubb/core";
import { type KubbEvents, safeBuild } from "@kubb/core";
import { createLogger } from "@kubb/core/logger";
import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import type { Logger } from "vite";
import type { Options } from "./types.ts";
import { AsyncEventEmitter } from "packages/core/src/utils/AsyncEventEmitter.ts";

type RollupContext = {
  warn?: (message: string) => void;
  error?: (message: string | Error) => void;
};

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options,
  meta,
) => {
  const name = "unplugin-kubb" as const;
  const logger = createLogger({ name });
  const events = new AsyncEventEmitter<KubbEvents>();
  const isVite = meta.framework === "vite";

  function setupLogger(viteLogger?: Logger, rollupCtx?: RollupContext) {
    // if (viteLogger) {
    //   // Vite integration
    //   events.on('start', (message: string) => viteLogger.info(`${name}: ${message}`))
    //   events.on('success', (message: string) => viteLogger.info(`${name}: ${message}`))
    //   events.on('warning', (message: string) => viteLogger.warn(`${name}: ${message}`))
    //   events.on('error', (message: string) => viteLogger.error(`${name}: ${message}`))
    // } else if (rollupCtx) {
    //   // Rollup-like bundlers (Rollup, Webpack, Rspack, esbuild, etc.)
    //   events.on('start', (message: string) => rollupCtx.warn?.(`${name}: ${message}`))
    //   events.on('success', (message: string) => rollupCtx.warn?.(`${name}: ${message}`))
    //   events.on('warning', (message: string) => rollupCtx.warn?.(`${name}: ${message}`))
    //   events.on('error', (message: string) => {
    //     rollupCtx.error?.(`${name}: ${message}`) || console.error(`${name}: ${message}`)
    //   })
    // }
  }

  async function runBuild(ctx: RollupContext) {
    if (!options?.config) {
      ctx.error?.(`[${name}] Config is not set`);
      return;
    }

    const { root: _root, ...userConfig } = options.config as Config;

    const { error } = await safeBuild({
      config: {
        root: process.cwd(),
        ...userConfig,
        output: {
          write: true,
          ...userConfig.output,
        },
      },
      events,
      logLevel: 3,
    });

    if (error) {
      ctx.error?.(error);
    } else {
      logger.emit("success", "Build finished");
    }
  }

  return {
    name,
    enforce: "pre",
    apply: isVite ? "build" : undefined,

    async buildStart() {
      if (!isVite) {
        setupLogger(undefined, this as unknown as RollupContext);
      }
      await runBuild(this as unknown as RollupContext);
    },

    vite: {
      configResolved(config) {
        setupLogger(config.logger);
      },
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
