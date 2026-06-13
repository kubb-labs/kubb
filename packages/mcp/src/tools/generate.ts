import { AsyncEventEmitter } from '@internals/utils'
import { type Config, createKubb, type Diagnostic, Diagnostics, type KubbHooks } from '@kubb/core'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import type * as v from 'valibot'
import { NotifyTypes } from '../constants.ts'
import { generateSchema } from '../schemas/generateSchema.ts'
import { formatDiagnostics, loadUserConfig, resolveCwd, resolveUserConfig } from '../utils.ts'

export const generateTool = defineTool(
  {
    name: 'generate',
    description: 'Generate OpenAPI spec helpers using Kubb configuration',
    schema: generateSchema,
  },
  async function generate(schema: v.InferInput<typeof generateSchema>) {
    const { config: configPath, input, output, logLevel } = schema

    try {
      const hooks = new AsyncEventEmitter<KubbHooks>()
      const messages: Array<string> = []

      const notify = async (type: string, message: string, data?: Record<string, unknown>) => {
        messages.push(data ? `${type}: ${message} ${JSON.stringify(data)}` : `${type}: ${message}`)
      }

      hooks.on('kubb:info', async ({ message }: { message: string }) => {
        await notify(NotifyTypes.INFO, message)
      })

      hooks.on('kubb:success', async ({ message }: { message: string }) => {
        await notify(NotifyTypes.SUCCESS, message)
      })

      hooks.on('kubb:error', async ({ error }: { error: Error }) => {
        await notify(NotifyTypes.ERROR, error.message)
      })

      hooks.on('kubb:warn', async ({ message }: { message: string }) => {
        await notify(NotifyTypes.WARN, message)
      })

      hooks.on('kubb:diagnostic', async ({ diagnostic }: { diagnostic: Diagnostic }) => {
        await notify(NotifyTypes.DIAGNOSTIC, diagnostic.message, Diagnostics.serialize(diagnostic))
      })

      hooks.on('kubb:plugin:start', async ({ plugin }) => {
        await notify(NotifyTypes.PLUGIN_START, `Plugin starting: ${plugin.name}`)
      })

      hooks.on('kubb:plugin:end', async ({ plugin, duration }) => {
        await notify(NotifyTypes.PLUGIN_END, `Plugin finished: ${plugin.name}`, { duration })
      })

      hooks.on('kubb:files:processing:start', async () => {
        await notify(NotifyTypes.FILES_START, 'Starting file processing')
      })

      hooks.on('kubb:files:processing:update', async ({ files }: { files: Array<{ file: { name: string } }> }) => {
        await notify(NotifyTypes.FILES_UPDATE, `Processing ${files.length} files`)
      })

      hooks.on('kubb:files:processing:end', async () => {
        await notify(NotifyTypes.FILES_END, 'File processing complete')
      })

      hooks.on('kubb:generation:start', async () => {
        await notify(NotifyTypes.GENERATION_START, 'Generation started')
      })

      hooks.on('kubb:generation:end', async () => {
        await notify(NotifyTypes.GENERATION_END, 'Generation ended')
      })

      let userConfig: Config
      let cwd: string

      try {
        const configResult = await loadUserConfig(configPath, { notify })
        userConfig = configResult.userConfig
        cwd = configResult.cwd

        if (Array.isArray(userConfig)) {
          throw new Error('Array type in kubb.config.ts is not supported in this tool. Please provide a single configuration object.')
        }

        userConfig = await resolveUserConfig(userConfig, {
          configPath,
          logLevel,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        await notify(NotifyTypes.CONFIG_ERROR, errorMessage)
        return tool.error(errorMessage)
      }

      const inputPath = input ?? (userConfig.input && 'path' in userConfig.input ? userConfig.input.path : undefined)

      const config: Config = {
        ...userConfig,
        root: resolveCwd(userConfig, cwd),
        input: inputPath
          ? {
              ...userConfig.input,
              path: inputPath,
            }
          : userConfig.input,
        output: output
          ? {
              ...userConfig.output,
              path: output,
            }
          : userConfig.output,
      }

      await notify(NotifyTypes.CONFIG_READY, 'Configuration ready')
      await notify(NotifyTypes.SETUP_START, 'Setting up Kubb')

      const kubb = createKubb(config, { hooks })
      await kubb.setup()
      await notify(NotifyTypes.SETUP_END, 'Kubb setup complete')

      await notify(NotifyTypes.BUILD_START, 'Starting build')
      const { files, diagnostics } = await kubb.safeBuild()
      await notify(NotifyTypes.BUILD_END, `Build complete - Generated ${files.length} files`)

      const problems = diagnostics.filter(Diagnostics.isProblem)
      const errors = problems.filter((diagnostic) => diagnostic.severity === 'error')
      if (errors.length > 0) {
        await notify(NotifyTypes.BUILD_FAILED, `Build failed with ${errors.length} diagnostic(s)`)

        const serialized = problems.map((diagnostic) => Diagnostics.serialize(diagnostic))
        return tool.error(`Build failed:\n${formatDiagnostics(serialized)}\n\n\`\`\`json\n${JSON.stringify(serialized, null, 2)}\n\`\`\``)
      }

      await notify(NotifyTypes.BUILD_SUCCESS, `Build completed successfully - Generated ${files.length} files`)

      return tool.text(`Build completed successfully!\n\nGenerated ${files.length} files\n\n${messages.join('\n')}`)
    } catch (caughtError) {
      const serialized = Diagnostics.serialize(Diagnostics.from(caughtError))
      return tool.error(`Build error:\n${formatDiagnostics([serialized])}\n\n\`\`\`json\n${JSON.stringify(serialized, null, 2)}\n\`\`\``)
    }
  },
)
