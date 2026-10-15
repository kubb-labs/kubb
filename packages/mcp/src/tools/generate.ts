import path from 'node:path'
import process from 'node:process'
import { CONFIG_EXTENSIONS, findConfigFile, loadConfigFile } from '@internals/shared'
import { isPathInside } from '@internals/utils'
import { type Config, createKubb, type Diagnostic, Diagnostics, type KubbHooks, Hookable } from '@kubb/core'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as z from 'zod/mini'
import { formatDiagnostics } from '../utils.ts'

const generateSchema = z.object({
  config: z.optional(
    z
      .string()
      .check(
        z.minLength(1),
        z.describe(
          `Path to kubb.config file (supports ${CONFIG_EXTENSIONS.join(', ')}). If not provided, will look for kubb.config.* or .kubbrc.* in the current directory, its .config/ and configs/ folders, then each parent directory`,
        ),
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
    const messages: Array<string> = []

    /**
     * The failure response: the diagnostics as text and JSON, then the messages collected so far,
     * such as warnings, so the agent sees everything the run said.
     */
    const failure = (title: string, diagnostics: ReadonlyArray<Diagnostic>) => {
      const serialized = diagnostics.map((diagnostic) => Diagnostics.serialize(diagnostic))
      const log = messages.length ? `\n\nMessages:\n${messages.join('\n')}` : ''
      return tool.error(`${title}:\n${formatDiagnostics(serialized)}\n\n\`\`\`json\n${JSON.stringify(serialized, null, 2)}\n\`\`\`${log}`)
    }

    try {
      const hooks = new Hookable<KubbHooks>()

      const notify = (type: string, message: string, data?: Record<string, unknown>) => {
        messages.push(data ? `${type}: ${message} ${JSON.stringify(data)}` : `${type}: ${message}`)
      }

      hooks.hook('kubb:error', ({ error }) => notify('ERROR', error.message))
      hooks.hook('kubb:warn', ({ message }) => notify('WARN', message))
      hooks.hook('kubb:diagnostic', ({ diagnostic }) => notify('DIAGNOSTIC', diagnostic.message, Diagnostics.serialize(diagnostic)))

      // The AI client supplies the path, so it must carry a config extension and stay inside the working directory.
      const base = path.resolve(process.cwd())
      let file: string | undefined
      if (configPath) {
        const ext = path.extname(configPath)
        if (!CONFIG_EXTENSIONS.some((extension) => extension === ext)) {
          return tool.error(`Invalid config file extension "${ext}". Allowed: ${CONFIG_EXTENSIONS.join(', ')}`)
        }
        file = path.resolve(base, configPath)
        if (!isPathInside(file, base)) {
          return tool.error('Invalid config file path: must be within the current working directory')
        }
      } else {
        file = findConfigFile(base)
        if (!file) {
          return tool.error(
            `No config file found. Please provide a config path or create one of: ${CONFIG_EXTENSIONS.map((extension) => `kubb.config${extension}`).join(', ')}`,
          )
        }
      }

      let userConfig: Config
      try {
        const [first] = await loadConfigFile<Config>(file, { logLevel, config: configPath })
        if (!first) throw new Error('The config file exports an empty array of configurations')
        userConfig = first
      } catch (error) {
        return failure(`Failed to load config ${file}`, [Diagnostics.from(error)])
      }

      const cwd = path.dirname(file)
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

        return failure('Build failed', problems)
      }

      notify('BUILD_SUCCESS', `Build completed successfully - Generated ${result.files.length} files`)

      return tool.text(`Build completed successfully!\n\nGenerated ${result.files.length} files\n\n${messages.join('\n')}`)
    } catch (caughtError) {
      return failure('Build error', [Diagnostics.from(caughtError)])
    }
  },
)
