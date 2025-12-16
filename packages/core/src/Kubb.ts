import type { KubbFile } from '@kubb/fabric-core/types'
import type { Strategy } from './PluginManager.ts'
import type { Config, Plugin, PluginLifecycleHooks } from './types'

type DebugEvent = {
  date: Date
  logs: string[]
  fileName?: string
}

type ProgressStartMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  hookName: H
  plugins: Array<Plugin>
}

type ProgressStopMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  hookName: H
}

type ExecutingMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  strategy: Strategy
  hookName: H
  plugin: Plugin
  parameters?: unknown[] | undefined
  output?: unknown
}

type ExecutedMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  duration: number
  strategy: Strategy
  hookName: H
  plugin: Plugin
  parameters?: unknown[] | undefined
  output?: unknown
}

// TODO add more Kubb related types like Context, Plugin, ... this will keep the root types clean of Kubb related types (and we could export all types via .types.ts like Fabric)

export interface KubbEvents {
  /** Called at the beginning of the Kubb lifecycle. */
  'lifecycle:start': []
  /** Called at the end of the Kubb lifecycle. */
  'lifecycle:end': []

  'config:start': []
  'config:end': []

  'generation:start': [name: string | undefined]
  'generation:end': [name: string | undefined]
  'generation:summary': [
    {
      summary: string[]
      title: string
      success: boolean
    },
  ]

  'format:start': []
  'format:end': []

  'lint:start': []
  'lint:end': []

  'hooks:start': []
  'hooks:end': []

  'hook:start': [command: string]
  'hook:execute': [{ command: string | URL; args?: readonly string[] }, cb: () => void]
  'hook:end': [command: string]

  'version:new': [currentVersion: string, latestVersion: string]

  info: [message: string, info?: string]
  error: [error: Error, meta?: Record<string, unknown>]
  success: [message: string, info?: string]
  warn: [message: string, info?: string]
  debug: [meta: DebugEvent]
  'files:processing:start': [{ files: KubbFile.ResolvedFile[] }]
  'file:processing:update': [
    {
      processed: number
      total: number
      percentage: number
      source?: string
      file: KubbFile.ResolvedFile
      /**
       * Only added in Kubb, we don't have this in Fabric
       */
      config: Config
    },
  ]
  'files:processing:end': [{ files: KubbFile.ResolvedFile[] }]
  'plugin:start': [plugin: Plugin]
  'plugin:end': [plugin: Plugin, duration: number]
  'plugin:hook:progress:start': [meta: ProgressStartMeta]
  'plugin:hook:progress:end': [meta: ProgressStopMeta]
  'plugin:hook:processing:start': [meta: ExecutingMeta]
  'plugin:hook:processing:end': [meta: ExecutedMeta]
}
