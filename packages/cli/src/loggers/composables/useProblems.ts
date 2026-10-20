import { relative, resolve } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { read } from '@internals/utils'
import type { Adapter, Config, Diagnostic, DiagnosticFormatOptions, ProblemDiagnostic } from '@kubb/core'
import { Diagnostics, getInputKind, logLevel as logLevelMap } from '@kubb/core'
import { getInputPath, pluralize } from '../createLogger.ts'
import { locateInSpec } from '../specFrame.ts'
import { formatLine, useFeature, useLogger } from './context.ts'
import { useGeneration } from './useGeneration.ts'
import { usePhases } from './usePhases.ts'
import { useProgress } from './useProgress.ts'
import { useSpinner } from './useSpinner.ts'

/** Warnings, errors and diagnostics: printed as they come, or held back and grouped by plugin once a human's build ends. */
export function useProblems() {
  return useFeature('problems', () => {
    const { writer, silent, human, audience, logLevel, text, hook } = useLogger()
    const formatOptions: DiagnosticFormatOptions = {
      audience,
      verbose: logLevel >= logLevelMap.verbose,
      // The code lines up at the right edge, inside the group indent and the human view's per-problem indent.
      width: Math.min(process.stdout.columns || 80, 100) - (audience === 'human' ? 4 : 2),
    }
    const state = {
      /** Problems held back so the human view can print them grouped by plugin once the build ends. */
      problems: [] as Array<ProblemDiagnostic>,
      /** The finished config's diagnostics, for the closing verdict. */
      diagnostics: [] as Array<Diagnostic>,
      /** A local-file input, which a located diagnostic points into; `load` parses it once, on the first such diagnostic. */
      spec: undefined as { path: string; adapter: Adapter; source: Promise<string | undefined> } | undefined,
    }

    /** Format options for one problem, with its line and column in a local spec when its pointer resolves there. */
    async function optionsFor(problem: ProblemDiagnostic): Promise<DiagnosticFormatOptions> {
      const { location } = problem
      const { spec } = state
      if (!location || !spec) {
        return formatOptions
      }

      const source = await spec.source
      const position = source && locateInSpec({ adapter: spec.adapter, source, location })
      if (!position) {
        return formatOptions
      }
      return { ...formatOptions, position: { file: relative(process.cwd(), spec.path), ...position } }
    }

    /**
     * Prints problems grouped under their plugin's name, each with the code aligned at the right.
     */
    async function writeProblems(problems: ReadonlyArray<ProblemDiagnostic>) {
      if (!problems.length) {
        return
      }
      const formatted = await Promise.all(problems.map(async (problem) => Diagnostics.format(problem, await optionsFor(problem))))
      if (!human) {
        for (const lines of formatted) writer.diagnostic(lines)
        return
      }

      const byPlugin = Map.groupBy(
        problems.map((problem, index) => ({ plugin: problem.plugin ?? '', lines: formatted[index]! })),
        ({ plugin }) => plugin,
      )
      const lines = [...byPlugin].flatMap(([plugin, group]) => [
        ...(plugin ? [` ${styleText('bold', plugin)}`, ''] : []),
        ...group.flatMap((entry) => [...entry.lines.map((line) => `  ${line}`), '']),
      ])
      writer.diagnostic(lines.slice(0, -1))
    }

    hook('kubb:warn', ({ message, info }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      writer.warn(formatLine(styleText('yellow', '⚠'), message, logLevel >= logLevelMap.info ? info : undefined))
    })

    // Unguarded: a failure stays visible even at silent.
    hook('kubb:error', ({ error }) => {
      const spinner = useSpinner()
      const phase = usePhases().phase
      if (phase) {
        phase.failed = true
      }

      // Rendered as a `KUBB_UNKNOWN` diagnostic, so the output alone says what broke and where. The
      // name tells a `TypeError` from a plain `Error`.
      const message = error.name === 'Error' || Diagnostics.isError(error) ? error.message : `${error.name}: ${error.message}`
      const help = Diagnostics.isError(error) ? error.diagnostic.help : undefined
      const [headline = '', ...details] = Diagnostics.format({ code: Diagnostics.code.unknown, severity: 'error', message, help, cause: error }, formatOptions)

      if (!human) {
        spinner.stop()
        useProgress().stop()
        writer.diagnostic([headline, ...details])
        return
      }

      // The writer draws the error symbol, so the message goes in bare.
      if (spinner.active) {
        spinner.stop(message, 'failed')
      } else {
        writer.error(text(message))
      }
      if (details.length) {
        writer.block(details.map(text))
      }
    })

    hook('kubb:diagnostic', async ({ diagnostic }) => {
      // Silent still surfaces errors so failures stay visible. It drops warnings and info.
      if (silent && diagnostic.severity !== 'error') {
        return
      }
      // A Studio job's problems show in Studio; its job line counts the errors.
      if (useLogger().session && !Diagnostics.isUpdate(diagnostic)) {
        return
      }

      useSpinner().stop()
      useProgress().stop()

      if (Diagnostics.isUpdate(diagnostic)) {
        writer.update(
          [`\`v${diagnostic.currentVersion}\` → \`v${diagnostic.latestVersion}\``, 'Run `npm install -g @kubb/cli` to update'],
          'Update available for `Kubb`',
        )
        return
      }

      // Inside a build, the human view waits for the end to group by plugin.
      if (human && useGeneration().groupOpen) {
        state.problems.push(diagnostic)
        return
      }
      await writeProblems([diagnostic])
    })

    return {
      state,
      /** Points located diagnostics into the config's input when it is a local file. */
      setSpec(config: Config) {
        const input = getInputPath(config)
        if (input && config.adapter?.locate && getInputKind(input) === 'file') {
          const path = resolve(config.root, input)
          // Read lazily, once, and only when a diagnostic needs a frame.
          let source: Promise<string | undefined> | undefined
          state.spec = {
            path,
            adapter: config.adapter,
            get source() {
              return (source ??= read(path).catch(() => undefined))
            },
          }
        }
      },
      /** Prints the problems held back so far. */
      flush() {
        return writeProblems(state.problems.splice(0))
      },
      /** `✖ Failed  1 error · 1 warning  in plugin-ts` once the build ended, or `✗ Generation failed` for a run that stopped early. */
      failedTitle(): string {
        const { errors, warnings } = Diagnostics.count(state.diagnostics)
        const counts = [errors && pluralize(errors, 'error'), warnings && pluralize(warnings, 'warning')].filter(Boolean).join(' · ')
        if (!human || !counts) {
          return '✗ Generation failed'
        }
        const plugins = Diagnostics.failedPlugins(state.diagnostics)
        return `✖ Failed  ${counts}${plugins.length ? `  in ${plugins.join(', ')}` : ''}`
      },
      reset() {
        Object.assign(state, { problems: [], diagnostics: [], spec: undefined })
      },
    }
  })
}
