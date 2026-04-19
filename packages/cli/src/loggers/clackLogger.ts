import { relative } from "node:path";
import process from "node:process";
import { styleText } from "node:util";
import * as clack from "@clack/prompts";
import {
  formatMs,
  formatMsWithColor,
  getIntro,
  toCause,
} from "@internals/utils";
import { defineLogger, logLevel as logLevelMap } from "@kubb/core";
import { getSummary } from "../utils/getSummary.ts";
import { runHook } from "../utils/runHook.ts";
import { ClackWritable } from "../utils/Writables.ts";
import {
  buildProgressLine,
  formatCommandWithArgs,
  formatMessage,
} from "./utils.ts";

/**
 * Clack adapter for local TTY environments
 * Provides a beautiful CLI UI with flat structure inspired by Claude's CLI patterns
 */
export const clackLogger = defineLogger({
  name: "clack",
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info;
    const state = {
      totalPlugins: 0,
      completedPlugins: 0,
      failedPlugins: 0,
      totalFiles: 0,
      processedFiles: 0,
      hrStart: process.hrtime(),
      spinner: clack.spinner(),
      isSpinning: false,
      activeProgress: new Map<
        string,
        { interval?: NodeJS.Timeout; progressBar: clack.ProgressResult }
      >(),
    };

    function reset() {
      for (const [_key, active] of state.activeProgress) {
        if (active.interval) {
          clearInterval(active.interval);
        }
        active.progressBar?.stop();
      }

      state.totalPlugins = 0;
      state.completedPlugins = 0;
      state.failedPlugins = 0;
      state.totalFiles = 0;
      state.processedFiles = 0;
      state.hrStart = process.hrtime();
      state.spinner = clack.spinner();
      state.isSpinning = false;
      state.activeProgress.clear();
    }

    function showProgressStep() {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const line = buildProgressLine(state);
      if (line) {
        clack.log.step(getMessage(line));
      }
    }

    function getMessage(message: string): string {
      return formatMessage(message, logLevel);
    }

    function startSpinner(text?: string) {
      state.spinner.start(text);
      state.isSpinning = true;
    }

    function stopSpinner(text?: string) {
      state.spinner.stop(text);
      state.isSpinning = false;
    }

    context.on("kubb:info", (message, info = "") => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const text = getMessage(
        [styleText("blue", "ℹ"), message, styleText("dim", info)].join(" "),
      );

      if (state.isSpinning) {
        state.spinner.message(text);
      } else {
        clack.log.info(text);
      }
    });

    context.on("kubb:success", (message, info = "") => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const text = getMessage(
        [
          styleText("blue", "✓"),
          message,
          logLevel >= logLevelMap.info ? styleText("dim", info) : undefined,
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (state.isSpinning) {
        stopSpinner(text);
      } else {
        clack.log.success(text);
      }
    });

    context.on("kubb:warn", (message, info) => {
      if (logLevel < logLevelMap.warn) {
        return;
      }

      const text = getMessage(
        [
          styleText("yellow", "⚠"),
          message,
          logLevel >= logLevelMap.info && info
            ? styleText("dim", info)
            : undefined,
        ]
          .filter(Boolean)
          .join(" "),
      );

      clack.log.warn(text);
    });

    context.on("kubb:error", (error) => {
      const caused = toCause(error);

      const text = [styleText("red", "✗"), error.message].join(" ");

      if (state.isSpinning) {
        stopSpinner(getMessage(text));
      } else {
        clack.log.error(getMessage(text));
      }

      // Show stack trace in debug mode (first 3 frames)
      if (logLevel >= logLevelMap.debug && error.stack) {
        const frames = error.stack.split("\n").slice(1, 4);
        for (const frame of frames) {
          clack.log.message(getMessage(styleText("dim", frame.trim())));
        }

        if (caused?.stack) {
          clack.log.message(styleText("dim", `└─ caused by ${caused.message}`));

          const frames = caused.stack.split("\n").slice(1, 4);
          for (const frame of frames) {
            clack.log.message(
              getMessage(`    ${styleText("dim", frame.trim())}`),
            );
          }
        }
      }
    });

    context.on("kubb:version:new", (version, latestVersion) => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      try {
        clack.box(
          `\`v${version}\` → \`v${latestVersion}\`
Run \`npm install -g @kubb/cli\` to update`,
          "Update available for `Kubb`",
          {
            width: "auto",
            formatBorder: (s: string) => styleText("yellow", s),
            rounded: true,
            withGuide: false,
            contentAlign: "center",
            titleAlign: "center",
          },
        );
      } catch {
        console.log(
          `Update available for Kubb: v${version} → v${latestVersion}`,
        );
        console.log("Run `npm install -g @kubb/cli` to update");
      }
    });

    context.on("kubb:lifecycle:start", async (version) => {
      console.log(
        `\n${getIntro({ title: "The ultimate toolkit for working with APIs", description: "Ready to start", version, areEyesOpen: true })}\n`,
      );

      reset();
    });

    context.on("kubb:config:start", () => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const text = getMessage("Configuration started");

      clack.intro(text);
      startSpinner(getMessage("Configuration loading"));
    });

    context.on("kubb:config:end", (_configs) => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const text = getMessage("Configuration completed");

      clack.outro(text);
    });

    context.on("kubb:generation:start", (config) => {
      reset();

      // Initialize progress tracking for this generation
      state.totalPlugins = config.plugins?.length ?? 0;

      const text = getMessage(
        [
          "Generation started",
          config.name ? `for ${styleText("dim", config.name)}` : undefined,
        ]
          .filter(Boolean)
          .join(" "),
      );

      clack.intro(text);
    });

    context.on("kubb:plugin:start", (plugin) => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      stopSpinner();

      const progressBar = clack.progress({
        style: "block",
        max: 100,
        size: 30,
      });
      const text = getMessage(`Generating ${styleText("bold", plugin.name)}`);
      progressBar.start(text);

      const interval = setInterval(() => {
        progressBar.advance();
      }, 100);

      state.activeProgress.set(plugin.name, { progressBar, interval });
    });

    context.on("kubb:plugin:end", (plugin, { duration, success }) => {
      stopSpinner();

      const active = state.activeProgress.get(plugin.name);

      if (!active || logLevel === logLevelMap.silent) {
        return;
      }

      clearInterval(active.interval);

      if (success) {
        state.completedPlugins++;
      } else {
        state.failedPlugins++;
      }

      const durationStr = formatMsWithColor(duration);
      const text = getMessage(
        success
          ? `${styleText("bold", plugin.name)} completed in ${durationStr}`
          : `${styleText("bold", plugin.name)} failed in ${styleText("red", formatMs(duration))}`,
      );

      active.progressBar.stop(text);
      state.activeProgress.delete(plugin.name);

      // Show progress step after each plugin
      showProgressStep();
    });

    context.on("kubb:files:processing:start", (files) => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      stopSpinner();

      state.totalFiles = files.length;
      state.processedFiles = 0;

      const text = `Writing ${files.length} files`;
      const progressBar = clack.progress({
        style: "block",
        max: files.length,
        size: 30,
      });

      context.emit("kubb:info", text);
      progressBar.start(getMessage(text));
      state.activeProgress.set("files", { progressBar });
    });

    context.on("kubb:file:processing:update", ({ file, config }) => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      stopSpinner();

      state.processedFiles++;

      const text = `Writing ${relative(config.root, file.path)}`;
      const active = state.activeProgress.get("files");

      if (!active) {
        return;
      }

      active.progressBar.advance(undefined, text);
    });
    context.on("kubb:files:processing:end", () => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      stopSpinner();

      const text = getMessage("Files written successfully");
      const active = state.activeProgress.get("files");

      if (!active) {
        return;
      }

      active.progressBar.stop(text);
      state.activeProgress.delete("files");

      // Show final progress step after files are written
      showProgressStep();
    });

    context.on("kubb:generation:end", (config) => {
      const text = getMessage(
        config.name
          ? `Generation completed for ${styleText("dim", config.name)}`
          : "Generation completed",
      );

      clack.outro(text);
    });

    context.on("kubb:format:start", () => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const text = getMessage("Format started");

      clack.intro(text);
    });

    context.on("kubb:format:end", () => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const text = getMessage("Format completed");

      clack.outro(text);
    });

    context.on("kubb:lint:start", () => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const text = getMessage("Lint started");

      clack.intro(text);
    });

    context.on("kubb:lint:end", () => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const text = getMessage("Lint completed");

      clack.outro(text);
    });

    context.on("kubb:hook:start", async ({ id, command, args }) => {
      const commandWithArgs = formatCommandWithArgs(command, args);
      const text = getMessage(
        `Hook ${styleText("dim", commandWithArgs)} started`,
      );

      // Skip hook execution if no id is provided (e.g., during benchmarks or tests)
      if (!id) {
        return;
      }

      if (logLevel <= logLevelMap.silent) {
        await runHook({
          id,
          command,
          args,
          commandWithArgs,
          context,
          sink: {
            onStderr: (s) => console.error(s),
            onStdout: (s) => console.log(s),
          },
        });
        return;
      }

      clack.intro(text);

      const logger = clack.taskLog({
        title: getMessage(
          [
            "Executing hook",
            logLevel >= logLevelMap.info
              ? styleText("dim", commandWithArgs)
              : undefined,
          ]
            .filter(Boolean)
            .join(" "),
        ),
      });

      const writable = new ClackWritable(logger);

      await runHook({
        id,
        command,
        args,
        commandWithArgs,
        context,
        stream: true,
        sink: {
          onLine: (line) => writable.write(line),
          onStderr: (s) => logger.error(s),
          onStdout: (s) => logger.message(s),
        },
      });
    });

    context.on("kubb:hook:end", ({ command, args }) => {
      if (logLevel <= logLevelMap.silent) {
        return;
      }

      const commandWithArgs = formatCommandWithArgs(command, args);
      const text = getMessage(
        `Hook ${styleText("dim", commandWithArgs)} successfully executed`,
      );

      clack.outro(text);
    });

    context.on(
      "kubb:generation:summary",
      (
        config,
        { pluginTimings, failedPlugins, filesCreated, status, hrStart },
      ) => {
        const summary = getSummary({
          failedPlugins,
          filesCreated,
          config,
          status,
          hrStart,
          pluginTimings:
            logLevel >= logLevelMap.verbose ? pluginTimings : undefined,
        });
        const title = config.name || "";

        summary.unshift("\n");
        summary.push("\n");

        const borderColor = status === "success" ? "green" : "red";
        try {
          clack.box(summary.join("\n"), getMessage(title), {
            width: "auto",
            formatBorder: (s: string) => styleText(borderColor, s),
            rounded: true,
            withGuide: false,
            contentAlign: "left",
            titleAlign: "center",
          });
        } catch {
          console.log(summary.join("\n"));
        }
      },
    );

    context.on("kubb:lifecycle:end", () => {
      reset();
    });
  },
});
