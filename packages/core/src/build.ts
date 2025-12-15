import { join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import type { KubbFile } from "@kubb/fabric-core/types";
import type { Fabric } from "@kubb/react-fabric";
import { createFabric } from "@kubb/react-fabric";
import { typescriptParser } from "@kubb/react-fabric/parsers";
import { fsPlugin } from "@kubb/react-fabric/plugins";
import { isDeepEqual } from "remeda";
import { isInputPath } from "./config.ts";
import { clean, exists, getRelativePath, write } from "./fs/index.ts";

import { PluginManager } from "./PluginManager.ts";
import type {
  Config,
  KubbEvents,
  Output,
  Plugin,
  UserConfig,
} from "./types.ts";
import { getDiagnosticInfo } from "./utils/diagnostics.ts";
import { URLPath } from "./utils/URLPath.ts";
import type { AsyncEventEmitter } from "./utils/AsyncEventEmitter.ts";
import type { LogLevel } from "./logger/types.ts";

type BuildOptions = {
  config: UserConfig;
  events: AsyncEventEmitter<KubbEvents>;
  logLevel: LogLevel;
};

type BuildOutput = {
  failedPlugins: Set<{ plugin: Plugin; error: Error }>;
  fabric: Fabric;
  files: Array<KubbFile.ResolvedFile>;
  pluginManager: PluginManager;
  pluginTimings: Map<string, number>;
  error?: Error;
};

type SetupResult = {
  events: AsyncEventEmitter<KubbEvents>;
  logLevel: LogLevel;
  fabric: Fabric;
  pluginManager: PluginManager;
};

export async function setup(options: BuildOptions): Promise<SetupResult> {
  const { config: userConfig, events, logLevel } = options;

  const diagnosticInfo = getDiagnosticInfo();

  if (Array.isArray(userConfig.input)) {
    events.emit('warn', "This feature is still under development — use with caution")
  }

  events.emit("debug", {
    date: new Date(),
    category: "setup",
    logs: [
      "Configuration:",
      `  • Name: ${userConfig.name || "unnamed"}`,
      `  • Root: ${userConfig.root || process.cwd()}`,
      `  • Output: ${userConfig.output?.path || "not specified"}`,
      `  • Plugins: ${userConfig.plugins?.length || 0}`,
      "Output Settings:",
      `  • Write: ${userConfig.output?.write !== false ? "enabled" : "disabled"}`,
      `  • Formater: ${userConfig.output?.format || "none"}`,
      `  • Linter: ${userConfig.output?.lint || "none"}`,
      "Environment:",
      Object.entries(diagnosticInfo)
        .map(([key, value]) => `  • ${key}: ${value}`)
        .join("\n"),
    ],
  });

  try {
    if (isInputPath(userConfig) && !new URLPath(userConfig.input.path).isURL) {
      await exists(userConfig.input.path);

      events.emit("debug", {
        date: new Date(),
        category: "setup",
        logs: [`✓ Input file validated: ${userConfig.input.path}`],
      });
    }
  } catch (e) {
    if (isInputPath(userConfig)) {
      const error = e as Error;

      throw new Error(
        `Cannot read file/URL defined in \`input.path\` or set with \`kubb generate PATH\` in the CLI of your Kubb config ${userConfig.input.path}`,
        {
          cause: error,
        },
      );
    }
  }

  const definedConfig: Config = {
    root: userConfig.root || process.cwd(),
    ...userConfig,
    output: {
      write: true,
      barrelType: "named",
      extension: {
        ".ts": ".ts",
      },
      defaultBanner: "simple",
      ...userConfig.output,
    },
    plugins: userConfig.plugins as Config["plugins"],
  };

  if (definedConfig.output.clean) {
    events.emit("debug", {
      date: new Date(),
      category: "setup",
      logs: [
        "Cleaning output directories",
        `  • Output: ${definedConfig.output.path}`,
        "  • Cache: .kubb",
      ],
    });
    await clean(definedConfig.output.path);
    await clean(join(definedConfig.root, ".kubb"));
  }

  const fabric = createFabric();
  fabric.use(fsPlugin, { dryRun: !definedConfig.output.write });
  fabric.use(typescriptParser);

  fabric.context.on("files:processing:start", ({ files }) => {
    events.emit("files:processing:start", {
      id: "files",
      size: files.length,
      message: "Writing files ...",
    });
    events.emit("debug", {
      date: new Date(),
      category: "file",
      logs: [`Writing ${files.length} files...`],
    });
  });

  fabric.context.on("files:processing:update", async ({ file, source }) => {
    const message = file
      ? `Writing ${relative(definedConfig.root, file.path)}`
      : "";
    events.emit("files:processing:update", { id: "files", message });

    if (source) {
      await write(file.path, source, { sanity: false });
    }
  });

  fabric.context.on("files:processing:end", ({ files }) => {
    events.emit("files:processing:end", { id: "files", files });
    events.emit("debug", {
      date: new Date(),
      category: "file",
      logs: ["✓ File write process completed"],
    });
  });

  events.emit("debug", {
    date: new Date(),
    category: "setup",
    logs: [
      "✓ Fabric initialized",
      `  • File writing: ${definedConfig.output.write ? "enabled" : "disabled (dry-run)"}`,
      `  • Barrel type: ${definedConfig.output.barrelType || "none"}`,
    ],
  });

  const pluginManager = new PluginManager(definedConfig, {
    fabric,
    events,
    concurrency: 5,
  });

  // pluginManager.on('executing', ({ plugin, hookName, strategy, parameters }) => {
  //   events.emit('debug', {
  //     date: new Date(),
  //     category: 'hook',
  //     pluginName: plugin.name,
  //     logs: [`Executing hook: ${hookName}`, `  • Strategy: ${strategy}`, '  • Parameters:', JSON.stringify(parameters, null, 2)],
  //   })
  // })

  // pluginManager.on('executed', ({ plugin, hookName, duration, parameters }) => {
  //   let message = ''
  //   if (hookName === 'resolvePath') {
  //     const [path] = parameters || []
  //     message = `Resolving path '${path}'`
  //   }

  //   if (hookName === 'resolveName') {
  //     const [name, type] = parameters || []
  //     message = `Resolving name '${name}' and type '${type}'`
  //   }

  //   events.emit('progressed', {
  //     id: hookName,
  //     message: `${plugin.name}: ${message}`,
  //   })
  //   events.emit('debug', {
  //     date: new Date(),
  //     category: 'hook',
  //     pluginName: plugin.name,
  //     logs: [`✓ Completed in ${duration}ms`],
  //   })
  // })

  // pluginManager.on('progress:start', ({ hookName, plugins }) => {
  //   events.emit('progress:start', {
  //     id: hookName,
  //     size: plugins.length,
  //     message: 'Running plugins...',
  //   })
  // })

  // pluginManager.on('progress:stop', ({ hookName }) => {
  //   events.emit('progress:stop', { id: hookName })
  // })

  // pluginManager.on('error', (error, { plugin, strategy, duration, parameters, hookName }) => {
  //   const text = `${error.message} (plugin: ${plugin?.name || 'unknown'}, hook: ${hookName || 'unknown'})`

  //   logger.emit('error', text, error)

  //   logger.emit('debug', {
  //     date: new Date(),
  //     category: 'error',
  //     pluginName: plugin.name,
  //     logs: [
  //       `✗ Hook '${hookName}' failed after ${duration}ms`,
  //       `  • Strategy: ${strategy}`,
  //       `  • Error: ${error.constructor.name} - ${error.message}`,
  //       '  • Stack Trace:',
  //       error.stack || 'No stack trace available',
  //       '  • Parameters:',
  //       JSON.stringify(parameters, null, 2),
  //     ],
  //   })
  // })

  // logger.emit('debug', {
  //   date: new Date(),
  //   category: 'setup',
  //   logs: ['✓ PluginManager initialized', '  • Concurrency: 5', `  • Total plugins: ${pluginManager.plugins.length}`],
  // })

  return {
    events,
    logLevel,
    fabric,
    pluginManager,
  };
}

export async function build(
  options: BuildOptions,
  overrides?: SetupResult,
): Promise<BuildOutput> {
  const { fabric, files, pluginManager, failedPlugins, pluginTimings, error } =
    await safeBuild(options, overrides);

  if (error) {
    throw error;
  }

  return {
    failedPlugins,
    fabric,
    files,
    pluginManager,
    pluginTimings,
    error,
  };
}

export async function safeBuild(
  options: BuildOptions,
  overrides?: SetupResult,
): Promise<BuildOutput> {
  const { fabric, pluginManager, events, logLevel } = overrides
    ? overrides
    : await setup(options);

  const failedPlugins = new Set<{ plugin: Plugin; error: Error }>();
  const pluginTimings = new Map<string, number>();
  const config = pluginManager.config;

  try {
    for (const plugin of pluginManager.plugins) {
      const context = pluginManager.getContext(plugin);

      const installer = plugin.install.bind(context);

      try {
        const startTime = performance.now();
        const timestamp = new Date();

        events.emit("plugin:start", plugin);

        events.emit("debug", {
          date: timestamp,
          category: "plugin",
          pluginName: plugin.name,
          logs: [
            "Installing plugin...",
            `  • Plugin Key: ${JSON.stringify(plugin.key)}`,
          ],
        });

        await installer(context);

        const duration = Math.round(performance.now() - startTime);
        pluginTimings.set(plugin.name, duration);

        events.emit("plugin:end", plugin, duration);

        events.emit("debug", {
          date: new Date(),
          category: "plugin",
          pluginName: plugin.name,
          logs: [`✓ Plugin installed successfully (${duration}ms)`],
        });
      } catch (e) {
        const error = e as Error;
        const errorTimestamp = new Date();

        events.emit("debug", {
          date: errorTimestamp,
          category: "error",
          pluginName: plugin.name,
          logs: [
            "✗ Plugin installation failed",
            `  • Plugin Key: ${JSON.stringify(plugin.key)}`,
            `  • Error: ${error.constructor.name} - ${error.message}`,
            "  • Stack Trace:",
            error.stack || "No stack trace available",
          ],
        });

        failedPlugins.add({ plugin, error });
      }
    }

    if (config.output.barrelType) {
      const root = resolve(config.root);
      const rootPath = resolve(root, config.output.path, "index.ts");

      events.emit("debug", {
        date: new Date(),
        logs: [
          "Generating barrel file",
          `  • Type: ${config.output.barrelType}`,
          `  • Path: ${rootPath}`,
        ],
      });

      const barrelFiles = fabric.files.filter((file) => {
        return file.sources.some((source) => source.isIndexable);
      });

      events.emit("debug", {
        date: new Date(),
        logs: [`Found ${barrelFiles.length} indexable files for barrel export`],
      });

      const rootFile: KubbFile.File = {
        path: rootPath,
        baseName: "index.ts",
        exports: barrelFiles
          .flatMap((file) => {
            const containsOnlyTypes = file.sources?.every(
              (source) => source.isTypeOnly,
            );

            return file.sources
              ?.map((source) => {
                if (!file.path || !source.isIndexable) {
                  return undefined;
                }

                // validate of the file is coming from plugin x, needs pluginKey on every file TODO update typing
                const plugin = [...pluginManager.plugins].find((item) => {
                  const meta = file.meta as any;
                  return isDeepEqual(item.key, meta?.pluginKey);
                });
                const pluginOptions = plugin?.options as {
                  output?: Output<any>;
                };

                if (
                  !pluginOptions ||
                  pluginOptions?.output?.barrelType === false
                ) {
                  return undefined;
                }

                return {
                  name:
                    config.output.barrelType === "all"
                      ? undefined
                      : [source.name],
                  path: getRelativePath(rootPath, file.path),
                  isTypeOnly:
                    config.output.barrelType === "all"
                      ? containsOnlyTypes
                      : source.isTypeOnly,
                } as KubbFile.Export;
              })
              .filter(Boolean);
          })
          .filter(Boolean),
        sources: [],
        meta: {},
      };

      await fabric.upsertFile(rootFile);

      events.emit("debug", {
        date: new Date(),
        category: "file",
        logs: [
          `✓ Generated barrel file (${rootFile.exports?.length || 0} exports)`,
        ],
      });
    }

    const files = [...fabric.files];

    await fabric.write({ extension: config.output.extension });

    return {
      failedPlugins,
      fabric,
      files,
      pluginManager,
      pluginTimings,
    };
  } catch (e) {
    return {
      failedPlugins,
      fabric,
      files: [],
      pluginManager,
      pluginTimings,
      error: e as Error,
    };
  }
}
