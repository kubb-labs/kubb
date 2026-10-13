import path from 'node:path'
import { CONFIG_EXTENSIONS } from '@internals/shared'
import { type Config, createKubb, Diagnostics, type KubbHooks, Hookable } from '@kubb/core'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as z from 'zod/mini'
import { formatDiagnostics, loadUserConfig } from '../utils.ts'

const generateSchema = z.object({
  config: z.optional(
    z
      .string()
      .check(
        z.minLength(1),
        z.describe(`Path to kubb.config file (supports ${CONFIG_EXTENSIONS.join(', ')}). If not provided, will look for kubb.config.* in current directory`),
      ),
  ),
  input: z.optional(z.string().check(z.minLength(1), z.describe('Path to OpenAPI/Swagger spec file (overrides config)'))),
  output: z.optional(z.string().check(z.minLength(1), z.describe('Output directory path (overrides config)'))),
  logLevel: z._default(z.enum(['silent', 'info', 'verbose']).check(z.describe('Log level for build output')), 'info'),
})

export const generateTool = defineTool(
  {
    name: 'generate',
    description: 'Generate OpenAPI spec helpers using Kubb configuration',
    schema: generateSchema,
  },
  async function generate(schema: z.input<typeof generateSchema>) {
    const { config: configPath, input, output, logLevel } = schema

    try {
      const hooks = new Hookable<KubbHooks>()
      const messages: Array<string> = []

      const notify = (type: string, message: string, data?: Record<string, unknown>) => {
        messages.push(data ? `${type}: ${message} ${JSON.stringify(data)}` : `${type}: ${message}`)
      }

      hooks.hook('kubb:info', ({ message }) => notify('INFO', message))
      hooks.hook('kubb:success', ({ message }) => notify('SUCCESS', message))
      hooks.hook('kubb:error', ({ error }) => notify('ERROR', error.message))
      hooks.hook('kubb:warn', ({ message }) => notify('WARN', message))
      hooks.hook('kubb:diagnostic', ({ diagnostic }) => notify('DIAGNOSTIC', diagnostic.message, Diagnostics.serialize(diagnostic)))
      hooks.hook('kubb:plugin:start', ({ plugin }) => notify('PLUGIN_START', `Plugin starting: ${plugin.name}`))
      hooks.hook('kubb:plugin:end', ({ plugin, duration }) => notify('PLUGIN_END', `Plugin finished: ${plugin.name}`, { duration }))
      hooks.hook('kubb:files:processing:start', () => notify('FILES_START', 'Starting file processing'))
      hooks.hook('kubb:files:processing:update', ({ files }) => notify('FILES_UPDATE', `Processing ${files.length} files`))
      hooks.hook('kubb:files:processing:end', () => notify('FILES_END', 'File processing complete'))
      hooks.hook('kubb:generation:start', () => notify('GENERATION_START', 'Generation started'))
      hooks.hook('kubb:setup:start', () => notify('SETUP_START', 'Setting up Kubb'))
      hooks.hook('kubb:setup:end', () => {
        notify('SETUP_END', 'Kubb setup complete')
        notify('BUILD_START', 'Starting build')
      })
      hooks.hook('kubb:generation:end', () => notify('GENERATION_END', 'Generation ended'))

      let userConfig: Config
      let cwd: string

      try {
        const configResult = await loadUserConfig(configPath, { notify })
        const loaded = configResult.userConfig
        cwd = configResult.cwd

        const resolved = await (typeof loaded === 'function' ? loaded({ logLevel, config: configPath }) : loaded)
        if (Array.isArray(resolved)) {
          throw new Error('Array type in kubb.config.ts is not supported in this tool. Please provide a single configuration object.')
        }
        userConfig = resolved
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return tool.error(errorMessage)
      }

      const config: Config = {
        ...userConfig,
        root: path.resolve(cwd, userConfig.root ?? '.'),
        input: input ?? userConfig.input,
        output: output
          ? {
              ...userConfig.output,
              path: output,
            }
          : userConfig.output,
      }

      notify('CONFIG_READY', 'Configuration ready')

      const kubb = createKubb(config, { hooks })
      const result = await kubb.generate()
      notify('BUILD_END', `Build complete - Generated ${result.files.length} files`)

      const problems = result.diagnostics.filter(Diagnostics.isProblem)
      const errors = problems.filter((diagnostic) => diagnostic.severity === 'error')
      if (errors.length > 0) {
        notify('BUILD_FAILED', `Build failed with ${errors.length} diagnostic(s)`)

        const serialized = problems.map((diagnostic) => Diagnostics.serialize(diagnostic))
        return tool.error(`Build failed:\n${formatDiagnostics(serialized)}\n\n\`\`\`json\n${JSON.stringify(serialized, null, 2)}\n\`\`\``)
      }

      notify('BUILD_SUCCESS', `Build completed successfully - Generated ${result.files.length} files`)

      return tool.text(`Build completed successfully!\n\nGenerated ${result.files.length} files\n\n${messages.join('\n')}`)
    } catch (caughtError) {
      const serialized = Diagnostics.serialize(Diagnostics.from(caughtError))
      return tool.error(`Build error:\n${formatDiagnostics([serialized])}\n\n\`\`\`json\n${JSON.stringify(serialized, null, 2)}\n\`\`\``)
    }
  },
)
