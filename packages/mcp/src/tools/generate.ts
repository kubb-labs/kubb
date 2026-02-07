import { type Config, type KubbEvents, safeBuild, setup } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.d.ts'
import type { z } from 'zod'
import type { generateSchema } from '../schemas/generateSchema.ts'
import { NotifyTypes } from '../types.ts'
import { loadUserConfig } from '../utils/loadUserConfig.ts'
import { resolveCwd } from '../utils/resolveCwd.ts'
import { resolveUserConfig } from '../utils/resolveUserConfig.ts'

interface NotificationHandler {
  sendNotification(method: string, params: unknown): Promise<void>
}

/**
 * Build tool that generates code from OpenAPI specs using Kubb.
 * Sends real-time notifications of build progress and events.
 */
export async function generate(schema: z.infer<typeof generateSchema>, handler: NotificationHandler): Promise<CallToolResult> {
  const { config: configPath, input, output, logLevel } = schema

  try {
    const events = new AsyncEventEmitter<KubbEvents>()
    const messages: string[] = []

    // Helper to send notifications
    const notify = async (type: string, message: string, data?: Record<string, unknown>) => {
      messages.push(`${type}: ${message}`)

      await handler.sendNotification('kubb/progress', {
        type,
        message,
        timestamp: new Date().toISOString(),
        ...data,
      })
    }

    // Capture events for output and send notifications
    events.on('info', async (message: string) => {
      await notify(NotifyTypes.INFO, message)
    })

    events.on('success', async (message: string) => {
      await notify(NotifyTypes.SUCCESS, message)
    })

    events.on('error', async (error: Error) => {
      await notify(NotifyTypes.ERROR, error.message, { stack: error.stack })
    })

    events.on('warn', async (message: string) => {
      await notify(NotifyTypes.WARN, message)
    })

    // Plugin lifecycle events
    events.on('plugin:start', async ({ name }: { name: string }) => {
      await notify(NotifyTypes.PLUGIN_START, `Plugin starting: ${name}`)
    })

    events.on('plugin:end', async ({ name, duration }: { name: string; duration?: number }) => {
      await notify(NotifyTypes.PLUGIN_END, `Plugin finished: ${name}`, { duration })
    })

    // File processing events
    events.on('files:processing:start', async () => {
      await notify(NotifyTypes.FILES_START, 'Starting file processing')
    })

    events.on('file:processing:update', async ({ file }: { file: { name: string } }) => {
      await notify(NotifyTypes.FILE_UPDATE, `Processing file: ${file.name}`)
    })

    events.on('files:processing:end', async () => {
      await notify(NotifyTypes.FILES_END, 'File processing complete')
    })

    // Generation events
    events.on('generation:start', async () => {
      await notify(NotifyTypes.GENERATION_START, 'Generation started')
    })

    events.on('generation:end', async () => {
      await notify(NotifyTypes.GENERATION_END, 'Generation ended')
    })

    // Load and process configuration
    let userConfig: Config
    let cwd: string

    try {
      const configResult = await loadUserConfig(configPath, { notify })
      userConfig = configResult.userConfig
      cwd = configResult.cwd

      if (Array.isArray(userConfig) && userConfig.length) {
        throw new Error('Array type in kubb.config.ts is not supported in this tool. Please provide a single configuration object.')
      }

      userConfig = await resolveUserConfig(userConfig, { configPath, logLevel })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await notify(NotifyTypes.CONFIG_ERROR, errorMessage)
      return {
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
        isError: true,
      }
    }

    const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

    // Override config with CLI options
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

    await notify(NotifyTypes.CONFIG_READY, 'Configuration ready', {
      root: config.root,
    })

    // Setup and build
    await notify(NotifyTypes.SETUP_START, 'Setting up Kubb')

    const { fabric, pluginManager, sources } = await setup({
      config,
      events,
    })
    await notify(NotifyTypes.SETUP_END, 'Kubb setup complete')

    await notify(NotifyTypes.BUILD_START, 'Starting build')
    const { files, failedPlugins, error } = await safeBuild(
      {
        config,
        events,
      },
      { pluginManager, fabric, events, sources },
    )
    await notify(NotifyTypes.BUILD_END, `Build complete - Generated ${files.length} files`)

    if (error || failedPlugins.size > 0) {
      const allErrors: Error[] = [
        error,
        ...Array.from(failedPlugins)
          .filter((it) => it.error)
          .map((it) => it.error),
      ].filter(Boolean)

      await notify(NotifyTypes.BUILD_FAILED, `Build failed with ${allErrors.length} error(s)`, {
        errorCount: allErrors.length,
        errors: allErrors.map((err) => err.message),
      })

      return {
        content: [
          {
            type: 'text',
            text: `Build failed:\n${allErrors.map((err) => err.message).join('\n')}\n\n${messages.join('\n')}`,
          },
        ],
        isError: true,
      }
    }

    await notify(NotifyTypes.BUILD_SUCCESS, `Build completed successfully - Generated ${files.length} files`, {
      filesCount: files.length,
    })

    return {
      content: [
        {
          type: 'text',
          text: `Build completed successfully!\n\nGenerated ${files.length} files\n\n${messages.join('\n')}`,
        },
      ],
    }
  } catch (caughtError) {
    const error = caughtError as Error

    await handler.sendNotification('kubb/progress', {
      type: NotifyTypes.FATAL_ERROR,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Build error: ${error.message}\n${error.stack || ''}`,
        },
      ],
      isError: true,
    }
  }
}
