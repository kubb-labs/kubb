import process from 'node:process'
import { type KubbEvents, LogLevel } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { defineEventHandler } from 'h3'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { getConfigs } from '../utils/getConfigs.ts'
import { generate } from '../utils/generate.ts'
import { contextStorage, setGlobalContext, type KubbAgentContext } from '../utils/useKubbAgentContext.ts'

let initialized = false

export default defineEventHandler(async (event) => {
  // Initialize context once on first request
  if (!initialized) {
    initialized = true

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

      const context: KubbAgentContext = {
        config,
        events,
        onGenerate,
      }

      // Set global context that persists across requests
      setGlobalContext(context)

      // Also set in AsyncLocalStorage for this request
      return contextStorage.run(context, () => {
        // Context is set
      })
    } catch (error) {
      throw error
    }
  }
})
