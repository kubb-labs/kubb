import type { KubbFile } from "@kubb/fabric-core/types";
import type { Plugin, PluginLifecycleHooks } from "./types";
import type { Strategy } from "./utils/executeStrategies";
type DebugEvent = {
  date: Date;
  logs: string[];
  fileName?: string;
  /**
   * Category of the debug log, used for GitHub Actions grouping
   * - 'setup': Initial configuration and environment setup
   * - 'plugin': Plugin installation and execution
   * - 'hook': Plugin hook execution details
   * - 'schema': Schema parsing and generation
   * - 'file': File operations (read/write/generate)
   * - 'error': Error details and stack traces
   * - undefined: Generic logs (always inline)
   */
  category?: "setup" | "plugin" | "hook" | "schema" | "file" | "error";
  /**
   * Plugin name for grouping plugin-specific logs together
   */
  pluginName?: string;
  /**
   * Indicates if this is the start or end of a plugin's execution
   * - 'start': Start of plugin execution group
   * - 'end': End of plugin execution group
   */
  pluginGroupMarker?: "start" | "end";
  /**
   * Optional group ID for associating logs with specific groups (e.g., for GitHub Actions)
   */
  groupId?: string;
};

type ProgressStartMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> =
  {
    hookName: H;
    plugins: Array<Plugin>;
  };

type ProgressStopMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  hookName: H;
};

type ExecutingMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  strategy: Strategy;
  hookName: H;
  plugin: Plugin;
  parameters?: unknown[] | undefined;
  output?: unknown;
};

type ExecutedMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  duration: number;
  strategy: Strategy;
  hookName: H;
  plugin: Plugin;
  parameters?: unknown[] | undefined;
  output?: unknown;
};

// TODO add more Kubb related types like Context, PLugin, ... this will keep the root types clean of Kubb related types (and we could export all types via .types.ts like Fabric)

export interface KubbEvents {
  /** Called at the beginning of the Kubb lifecycle. */
  "lifecycle:start": [];

  /** Called at the end of the Kubb lifecycle. */
  "lifecycle:end": [];

  "lifecycle:success": [message: string];
  "log:error": [error: Error];
  "log:warning": [message: string];
  "log:verbose": [meta: DebugEvent];
  "log:debug": [meta: DebugEvent];
  // this will be used for the step
  "lifecycle:group": [groupId: string];
  "files:processing:start": [{ id: string; size: number; message?: string }];
  "files:processing:update": [
    {
      processed: number;
      total: number;
      percentage: number;
      source?: string;
      file: KubbFile.ResolvedFile;
    },
  ];
  "files:processing:end": [{ files: KubbFile.ResolvedFile[] }];
  "plugin:start": [plugin: Plugin];
  "plugin:end": [plugin: Plugin];

  "hook:progress:start": [meta: ProgressStartMeta];
  "hook:progress:end": [meta: ProgressStopMeta];
  "hook:processing:start": [meta: ExecutingMeta];
  "hook:processing:end": [meta: ExecutedMeta];
}
