import process from 'node:process'
import { resolve } from 'node:path'
import { styleText } from 'node:util'
import { findConfigFile } from '@internals/shared'
import { toError } from '@internals/utils'
import { trackRun } from '../../Telemetry.ts'
import { getConfigs } from '../../config.ts'
import { logCommandSummary } from '../../loggers/output.ts'

type ValidateOptions = {
  /**
   * Path or URL to the specification to validate.
   */
  input: string
  configPath?: string
}

/**
 * Validates `input` with the configured adapters, falling back to OpenAPI when no config exists.
 * Exits the process with code 1 on validation failure or missing dependency.
 */
export async function run({ input, configPath }: ValidateOptions): Promise<void> {
  const hrStart = process.hrtime()
  const report = trackRun({ command: 'validate', hrStart })
  let adapterName: string | undefined

  try {
    const configFile = configPath ?? findConfigFile()
    const fallback = async () => {
      adapterName = '@kubb/adapter-oas'
      const { adapterOas } = await import('@kubb/adapter-oas')
      return [{ adapter: adapterOas(), input }]
    }
    const targets = await (async () => {
      if (!configFile) return fallback()
      try {
        const { configs } = await getConfigs({ configPath: configFile, input })
        // An array config often repeats one adapter, so each adapter and input pair is validated once.
        const unique = new Map(
          configs.map((config) => {
            const resolved = URL.canParse(input) ? input : resolve(config.root || process.cwd(), input)
            return [`${config.adapter?.name}\0${resolved}`, { adapter: config.adapter, input: resolved }] as const
          }),
        )
        return [...unique.values()]
      } catch (error) {
        // A config found by search that does not load must not block validating a file; an explicit `--config` still fails.
        if (configPath) throw error
        return fallback()
      }
    })()
    const adapters: Array<string> = []
    if (!targets.length) throw new Error('The Kubb config contains no configurations to validate.')
    for (const target of targets) {
      adapterName = target.adapter?.name
      if (!target.adapter) throw new Error('No adapter is configured. Set adapter in your Kubb config to validate this specification.')
      await target.adapter.validate(target.input, { throwOnError: true })
      adapters.push(target.adapter.name)
    }
    const specifications = new Set(targets.map((target) => target.input)).size
    const adapterNames = [...new Set(adapters)]
    await report({ status: 'success' })

    logCommandSummary({
      title: 'Validation passed',
      status: 'success',
      hrStart,
      lines: [
        `  ${styleText('bold', `${specifications} specification${specifications === 1 ? '' : 's'} validated`)}`,
        `  ${styleText('dim', 'Input')}    ${styleText('cyan', input)}`,
        `  ${styleText('dim', adapterNames.length === 1 ? 'Adapter' : 'Adapters')}  ${adapterNames.join(', ')}`,
      ],
    })
  } catch (error) {
    await report({ status: 'failed' })
    const message = toError(error).message
    const missingAdapter = adapterName === '@kubb/adapter-oas' && /(?:Cannot find|Cannot resolve|not found)[\s\S]*@kubb\/adapter-oas/.test(message)
    logCommandSummary({
      title: missingAdapter ? 'Could not validate' : 'Validation failed',
      status: 'failed',
      hrStart,
      lines: [
        `  ${styleText('dim', 'Input')}    ${styleText('cyan', input)}`,
        `  ${styleText('dim', 'Adapter')}  ${adapterName ?? 'not configured'}${missingAdapter ? ' · not installed' : ''}`,
        '',
        styleText('bold', missingAdapter ? 'Required package' : 'Validation error'),
        `  ${styleText('red', message)}`,
        ...(missingAdapter
          ? ['', 'Install it with:', styleText('cyan', '  npm install @kubb/adapter-oas'), styleText('cyan', '  pnpm add @kubb/adapter-oas')]
          : []),
      ],
    })

    process.exit(1)
  }
}
