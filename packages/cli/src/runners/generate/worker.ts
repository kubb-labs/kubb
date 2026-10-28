import process from 'node:process'
import { cliReporter, type Config, Diagnostics, Hookable, type KubbHooks, logLevel as logLevelMap, type Reporter } from '@kubb/core'
import { getConfigs } from '../../config.ts'
import setupReporters from '../../loggers/reporters.ts'
import type { LoggerWriter } from '../../loggers/types.ts'
import type { ParentMessage, WorkerLaunch, WorkerMessage, WriterMethod } from './pool.ts'
import { generate } from './run.ts'

process.title = 'Kubb'

const post = (message: WorkerMessage) => process.send?.(message)

/** A writer whose every line goes to the parent, which draws it with its own writer in config order. */
function createRelayWriter(audience: LoggerWriter['audience']): LoggerWriter {
  const relay =
    <Method extends WriterMethod>(method: Method) =>
    (...args: Parameters<LoggerWriter[Method]>) =>
      void post({ kind: 'write', method, args })
  const step = relay('step')
  // A spinner or progress bar replayed after the fact would only flicker, so only its closing line crosses over.
  const stop = (text: string) => text && step(text)
  const noop = () => {}
  return {
    audience,
    group: relay('group'),
    groupEnd: relay('groupEnd'),
    step,
    info: relay('info'),
    success: relay('success'),
    warn: relay('warn'),
    error: relay('error'),
    block: relay('block'),
    raw: relay('raw'),
    diagnostic: relay('diagnostic'),
    update: relay('update'),
    spinner: () => ({ start: noop, message: noop, clear: noop, stop, error: relay('error') }),
    progress: () => ({ start: noop, advance: noop, stop }),
  }
}

/** Sends a reporter's result to the parent, which runs its own reporter on it. `cli` renders here, through the relayed writer. */
function createRelayReporter({ name, needsPluginFiles }: WorkerLaunch['reporters'][number]): Reporter {
  if (name === 'cli') return cliReporter
  return {
    name,
    needsPluginFiles,
    report({ config: _config, ...result }) {
      post({ kind: 'report', name, result })
    },
  }
}

const launch = await new Promise<WorkerLaunch>((resolve) => process.once('message', (message) => resolve(message as WorkerLaunch)))
const hooks = new Hookable<KubbHooks>()
const logLevel = logLevelMap[launch.logLevel as keyof typeof logLevelMap] ?? logLevelMap.info
setupReporters(hooks, { logLevel, reporters: launch.reporters.map(createRelayReporter), dryRun: launch.dryRun, writer: createRelayWriter(launch.audience) })

let configs: Array<Config> | undefined
process.on('message', async (message: ParentMessage) => {
  if (message.kind !== 'job') return
  let success = false
  try {
    configs ??= (await getConfigs({ configPath: launch.configPath, input: launch.input, watch: false, logLevel: launch.logLevel })).configs
    success = await generate({ input: launch.input, config: configs[message.index]!, hooks, dryRun: launch.dryRun })
  } catch (error) {
    post({ kind: 'error', diagnostic: Diagnostics.from(error) })
  }
  post({ kind: 'done', success })
})
