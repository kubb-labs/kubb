import type { KubbEvents } from '@kubb/core'
import { LogLevel } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { generate } from '../utils/generate.ts'
import { getConfigs } from '../utils/getConfigs.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { type KubbAgentContext, setGlobalContext } from '../utils/useKubbAgentContext.ts'

let initialized = false

export default defineEventHandler(async () => {
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
    } catch (error) {
      console.error('Failed to initialize Kubb agent context:', error)
      throw error
    }
  }
})
