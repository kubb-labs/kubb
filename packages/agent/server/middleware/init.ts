import process from 'node:process'
import { type KubbEvents, LogLevel } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { defineEventHandler } from 'h3'
import { generate } from '~/utils/generate.ts'
import { getConfigs } from '~/utils/getConfigs.ts'
import { getCosmiConfig } from '~/utils/getCosmiConfig.ts'
import { contextStorage, type KubbAgentContext } from '~/utils/useKubbAgentContext.ts'

let initError: Error | null = null
let initContext: KubbAgentContext | null = null

// Initialize on server startup
async function initializeContext() {
  try {
    const configPath = process.env.KUBB_CONFIG

    if (!configPath) {
      throw new Error('KUBB_CONFIG environment variable not set')
    }

    const events = new AsyncEventEmitter<KubbEvents>()
    const logLevel = LogLevel.info

    // Load config
    const result = await getCosmiConfig(configPath)
    const configs = await getConfigs(result)

    if (configs.length === 0) {
      throw new Error('No configs found')
    }

    // Use first config
    const config = configs[0]

    // Create generate function
    const onGenerate = async () => {
      await generate({
        config,
        events,
        logLevel,
      })
    }

    initContext = {
      config,
      events,
      onGenerate,
    }
  } catch (error) {
    initError = error instanceof Error ? error : new Error('Unknown error initializing config')
  }
}

// Initialize on first request if not already initialized
let initialized = false

export default defineEventHandler(async (event) => {
  if (!initialized) {
    await initializeContext()
    initialized = true
  }

  if (initError) {
    throw initError
  }

  if (!initContext) {
    throw new Error('Failed to initialize Kubb context')
  }

  // Wrap the request with the context
  return contextStorage.run(initContext, async () => {
    // Continue with request processing
    ;(await event.node.res.headersSent) || null
  })
})
