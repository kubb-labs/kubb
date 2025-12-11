import path from "node:path";
import type { Config, Plugin } from "@kubb/core";
import { randomCliColour } from "@kubb/core/logger";
import pc from "picocolors";
import { parseHrtimeToSeconds } from "./parseHrtimeToSeconds.ts";

type SummaryProps = {
  failedPlugins: Set<{ plugin: Plugin; error: Error }>;
  status: "success" | "failed";
  hrStart: [number, number];
  filesCreated: number;
  config: Config;
  pluginTimings?: Map<string, number>;
};

export function getSummary({
  failedPlugins,
  filesCreated,
  status,
  hrStart,
  config,
  pluginTimings,
}: SummaryProps): string[] {
  const logs = new Set<string>();
  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(hrStart));

  const pluginsCount = config.plugins?.length || 0;
  const successCount = pluginsCount - failedPlugins.size;

  const meta = {
    plugins:
      status === "success"
        ? `${pc.green(`${successCount} successful`)}, ${pluginsCount} total`
        : `${pc.green(`${successCount} successful`)}, ${pc.red(`${failedPlugins.size} failed`)}, ${pluginsCount} total`,
    pluginsFailed:
      status === "failed"
        ? [...failedPlugins]
            ?.map(({ plugin }) => randomCliColour(plugin.name))
            ?.join(", ")
        : undefined,
    filesCreated: filesCreated,
    time: `${pc.yellow(`${elapsedSeconds}s`)}`,
    output: path.isAbsolute(config.root)
      ? path.resolve(config.root, config.output.path)
      : config.root,
  } as const;

  // Calculate label padding for perfect alignment
  const labels = {
    plugins: 'Plugins:',
    failed: 'Failed:',
    generated: 'Generated:',
    output: 'Output:',
  };
  const maxLabelLength = Math.max(...Object.values(labels).map(l => l.length));
  
  const summaryLines: Array<[string, boolean]> = [
    [`${pc.bold(labels.plugins.padEnd(maxLabelLength))} ${meta.plugins}`, true],
    [
      `${pc.dim(labels.failed.padEnd(maxLabelLength))} ${meta.pluginsFailed || "none"}`,
      !!meta.pluginsFailed,
    ],
    [
      `${pc.bold(labels.generated.padEnd(maxLabelLength))} ${meta.filesCreated} files in ${meta.time}`,
      true,
    ],
  ];

  // Add plugin timing breakdown if available (similar to Vite/NX)
  if (pluginTimings && pluginTimings.size > 0) {
    const MAX_TOP_PLUGINS = 5;
    const TIME_SCALE_DIVISOR = 100; // Each 100ms = 1 bar character
    const MAX_BAR_LENGTH = 20;

    const sortedTimings = Array.from(pluginTimings.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TOP_PLUGINS);

    if (sortedTimings.length > 0) {
      summaryLines.push([`Plugin Timings:`, true]);
      
      // Find the longest plugin name for alignment
      const maxNameLength = Math.max(...sortedTimings.map(([name]) => name.length));
      
      sortedTimings.forEach(([name, time]) => {
        const timeStr =
          time >= 1000 ? `${(time / 1000).toFixed(2)}s` : `${Math.round(time)}ms`;
        const barLength = Math.min(
          Math.ceil(time / TIME_SCALE_DIVISOR),
          MAX_BAR_LENGTH,
        );
        const bar = "█".repeat(barLength);
        
        // Right-align plugin names, left-align bars, with consistent spacing
        const paddedName = name.padStart(maxNameLength, ' ');
        summaryLines.push([
          `  ${randomCliColour(paddedName)} ${pc.dim(bar)} ${pc.yellow(timeStr)}`,
          true,
        ]);
      });
    }
  }

  summaryLines.push([`${pc.bold(labels.output.padEnd(maxLabelLength))} ${meta.output}`, true]);

  logs.add(
    summaryLines
      .map((item) => {
        if (item.at(1)) {
          return item.at(0);
        }
        return undefined;
      })
      .filter(Boolean)
      .join("\n"),
  );

  return [...logs];
}
