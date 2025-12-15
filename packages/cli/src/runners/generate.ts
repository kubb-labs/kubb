import path from "node:path";
import process from "node:process";
import * as clack from "@clack/prompts";
import { type Config, type KubbEvents, safeBuild, setup } from "@kubb/core";
import { type Logger, type LogLevel, LogMapper } from "@kubb/core/logger";

import { execa } from "execa";
import pc from "picocolors";
import { executeHooks } from "../utils/executeHooks.ts";
import { getSummary } from "../utils/getSummary.ts";
import { ClackWritable } from "../utils/Writables.ts";
import type { AsyncEventEmitter } from "@kubb/core/utils";

type GenerateProps = {
  input?: string;
  config: Config;
  events: AsyncEventEmitter<KubbEvents>;
  logLevel: LogLevel;
};

export async function generate({
  input,
  config,
  events,
  logLevel,
}: GenerateProps): Promise<void> {
  const { root = process.cwd(), ...userConfig } = config;
  const inputPath =
    input ?? ("path" in userConfig.input ? userConfig.input.path : undefined);
  const hrStart = process.hrtime();

  events.emit("group:create", {
    title: [
      config.name
        ? `Generation started ${pc.dim(config.name)}`
        : "Generation started",
      logLevel > LogMapper.silent ? `for ${pc.dim(inputPath)}` : undefined,
    ]
      .filter(Boolean)
      .join(" "),
    groupId: "configuration",
  });

  events.emit("group:start", "Loading generation", "configuration");

  // Track progress bars for plugins and file writing
  const progressBars = new Map<string, ReturnType<typeof clack.progress>>();
  const progressIntervals = new Map<string, NodeJS.Timeout>();

  if (logLevel !== LogMapper.debug) {
    events.on("plugin:start", (plugin) => {
      // Create a progress bar for this plugin with indeterminate progress
      const pluginProgress = clack.progress({
        style: "block",
        max: 100,
        size: 30,
      });
      progressBars.set(plugin.name, pluginProgress);
      pluginProgress.start(`Generating ${plugin.name}`);

      // Simulate gradual progress while plugin is executing
      let currentProgress = 0;
      const interval = setInterval(() => {
        if (currentProgress < 90) {
          currentProgress += Math.random() * 10;
          if (currentProgress <= 90) {
            pluginProgress.advance();
          }
        }
      }, 100);
      progressIntervals.set(plugin.name, interval);
    });

    events.on("plugin:end", (plugin, duration) => {
      // Clear interval and complete progress
      const interval = progressIntervals.get(plugin.name);
      if (interval) {
        clearInterval(interval);
        progressIntervals.delete(plugin.name);
      }

      const pluginProgress = progressBars.get(plugin.name);
      if (pluginProgress) {
        // Advance to completion
        for (let i = 0; i < 10; i++) {
          pluginProgress.advance();
        }
        pluginProgress.stop(`${plugin.name} completed in ${duration}ms`);
        progressBars.delete(plugin.name);
      }
    });

    events.on("files:processing:start", ({ id, size }) => {
      if (id === "files") {
        const filesProgress = clack.progress({
          style: "heavy",
          max: size,
          size: 30,
          indicator: undefined,
        });
        progressBars.set("files", filesProgress);
        filesProgress.start(`Writing ${size} files`);
      }
    });

    events.on("files:processing:update", ({ id }) => {
      if (id === "files") {
        const filesProgress = progressBars.get("files");
        if (filesProgress) {
          filesProgress.advance();
        }
      }
    });

    events.on("files:processing:end", ({ id }) => {
      if (id === "files") {
        const filesProgress = progressBars.get("files");
        if (filesProgress) {
          filesProgress.stop("Files written successfully");
          progressBars.delete("files");
        }
      }
    });
  }

  const definedConfig: Config = {
    root,
    ...userConfig,
    input: inputPath
      ? {
          ...userConfig.input,
          path: inputPath,
        }
      : userConfig.input,
    output: {
      write: true,
      barrelType: "named",
      extension: {
        ".ts": ".ts",
      },
      format: "prettier",
      ...userConfig.output,
    },
  };

  const { fabric, pluginManager } = await setup({
    config: definedConfig,
    logLevel,
    events,
  });

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config: definedConfig,
      logLevel,
      events,
    },
    { pluginManager, fabric, events, logLevel },
  );

  const summary = getSummary({
    failedPlugins,
    filesCreated: files.length,
    config: definedConfig,
    status: failedPlugins.size > 0 || error ? "failed" : "success",
    hrStart,
    pluginTimings: logLevel >= LogMapper.verbose ? pluginTimings : undefined,
  });

  // Handle build failures (either from failed plugins or general errors)
  const hasFailures = failedPlugins.size > 0 || error;

  if (hasFailures) {
    console.log(
      `✗  Build failed ${logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ""}`,
    );

    // Collect all errors from failed plugins and general error
    const allErrors: Error[] = [
      error,
      ...Array.from(failedPlugins)
        .filter((it) => it.error)
        .map((it) => it.error),
    ].filter(Boolean);

    allErrors.forEach((err) => {
      // Display error causes in debug mode
      if (logLevel >= LogMapper.debug && err.cause) {
        console.error(err.cause);
      }

      console.error(err);
    });

    clack.box(summary.join(""), config.name || "", {
      width: "auto",
      formatBorder: pc.red,
      rounded: true,
      withGuide: false,
      contentAlign: "left",
      titleAlign: "center",
    });

    process.exit(1);
  }

  // events.emit(
  //   "stop",
  //   `Build completed ${logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ""}`,
  // );

  // formatting
  if (config.output.format) {
    // logger.emit("start", "Formatting started");

    const formatLogger = clack.taskLog({
      title: [
        `Formatting with ${pc.dim(config.output.format)}`,
        logLevel > LogMapper.silent
          ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}`
          : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    });
    const formatWritable = new ClackWritable(formatLogger);

    if (config.output.format === "prettier") {
      try {
        const result = await execa(
          "prettier",
          [
            "--ignore-unknown",
            "--write",
            path.resolve(definedConfig.root, definedConfig.output.path),
          ],
          {
            detached: true,
            stdout:
              logLevel === LogMapper.silent
                ? undefined
                : ["pipe", formatWritable],
            stripFinalNewline: true,
          },
        );

        formatLogger.success(
          [
            `Formatting with ${pc.dim(config.output.format)}`,
            logLevel > LogMapper.silent
              ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}`
              : undefined,
            "successfully",
          ]
            .filter(Boolean)
            .join(" "),
        );
        formatLogger.message(result.stdout);
      } catch (e) {
        events.emit("error", e as Error);
      }

      events.emit("success", `Formatted with ${config.output.format}`);
    }

    if (config.output.format === "biome") {
      try {
        const result = await execa(
          "biome",
          [
            "format",
            "--write",
            path.resolve(definedConfig.root, definedConfig.output.path),
          ],
          {
            detached: true,
            stdout:
              logLevel === LogMapper.silent
                ? undefined
                : ["pipe", formatWritable],
            stripFinalNewline: true,
          },
        );

        formatLogger.success(
          [
            `Formatting with ${pc.dim(config.output.format)}`,
            logLevel > LogMapper.silent
              ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}`
              : undefined,
            "successfully",
          ]
            .filter(Boolean)
            .join(" "),
        );
        formatLogger.message(result.stdout);
      } catch (e) {
        const error = new Error("Biome not found");
        error.cause = e;
        events.emit("error", error);
      }
    }

    // logger.emit("stop", "Formatting completed");
  }

  // linting
  if (config.output.lint) {
    // logger.emit("start", "Linting started");

    const lintLogger = clack.taskLog({
      title: [
        `Linting with ${pc.dim(config.output.lint)}`,
        logLevel > LogMapper.silent
          ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}`
          : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    });
    const lintWritable = new ClackWritable(lintLogger);

    if (config.output.lint === "eslint") {
      try {
        const result = await execa(
          "eslint",
          [
            path.resolve(definedConfig.root, definedConfig.output.path),
            "--fix",
          ],
          {
            detached: true,
            stdout:
              logLevel === LogMapper.silent
                ? undefined
                : ["pipe", lintWritable],
            stripFinalNewline: true,
          },
        );

        lintLogger.success(
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logLevel > LogMapper.silent
              ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}`
              : undefined,
            "successfully",
          ]
            .filter(Boolean)
            .join(" "),
        );
        lintLogger.message(result.stdout);
      } catch (e) {
        const error = new Error("Eslint not found");
        error.cause = e;
        events.emit("error", error);
      }
    }

    if (config.output.lint === "biome") {
      try {
        const result = await execa(
          "biome",
          [
            "lint",
            "--fix",
            path.resolve(definedConfig.root, definedConfig.output.path),
          ],
          {
            detached: true,
            stdout:
              logLevel === LogMapper.silent
                ? undefined
                : ["pipe", lintWritable],
            stripFinalNewline: true,
          },
        );

        lintLogger.success(
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logLevel > LogMapper.silent
              ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}`
              : undefined,
            "successfully",
          ]
            .filter(Boolean)
            .join(" "),
        );
        lintLogger.message(result.stdout);
      } catch (e) {
        const error = new Error("Biome not found");
        error.cause = e;
        events.emit("error", error);
      }
    }

    if (config.output.lint === "oxlint") {
      try {
        const result = await execa(
          "oxlint",
          [
            "--fix",
            path.resolve(definedConfig.root, definedConfig.output.path),
          ],
          {
            detached: true,
            stdout:
              logLevel === LogMapper.silent
                ? undefined
                : ["pipe", lintWritable],
            stripFinalNewline: true,
          },
        );

        lintLogger.success(
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logLevel > LogMapper.silent
              ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}`
              : undefined,
            "successfully",
          ]
            .filter(Boolean)
            .join(" "),
        );
        lintLogger.message(result.stdout);
      } catch (e) {
        const error = new Error("Oxlint not found");
        error.cause = e;
        events.emit("error", error);
      }
    }

    // logger?.emit("stop", "Linting completed");
  }

  if (config.hooks) {
    logger.emit("start", "Hooks started");
    await executeHooks({ hooks: config.hooks, logLevel });

    // logger?.emit("stop", "Hooks completed");
  }

  clack.box(summary.join(""), config.name || "", {
    width: "auto",
    formatBorder: pc.green,
    rounded: true,
    withGuide: false,
    contentAlign: "left",
    titleAlign: "center",
  });
}
