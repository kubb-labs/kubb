import { type KubbEvents, LogLevel } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { connectStudio } from '~/utils/connectStudio.ts'
import { getConfigs } from '~/utils/getConfigs.ts'
import { getCosmiConfig } from '~/utils/getCosmiConfig.ts'

export default defineNitroPlugin(async () => {
  // Connect to Kubb Studio if URL is provided
  const studioUrl = process.env.KUBB_STUDIO_URL
  const token = process.env.KUBB_AGENT_TOKEN
  const configPath = process.env.KUBB_CONFIG

  if (!configPath) {
    throw new Error('KUBB_CONFIG environment variable not set')
  }

  if (!token) {
    console.warn('KUBB_AGENT_TOKEN not set, cannot authenticate with studio')

    return null
  }

  if (!studioUrl) {
    console.warn('KUBB_STUDIO_URL not set, skipping studio connection')

    return null
  }

  // Load config
  const result = await getCosmiConfig(configPath)
  const configs = await getConfigs(result)

  if (configs.length === 0) {
    throw new Error('No configs found')
  }

  // Use first config
  const config = configs[0]
  const events = new AsyncEventEmitter<KubbEvents>()
  const logLevel = LogLevel.info

  await connectStudio({ studioUrl, token, configPath, config, logLevel, events })
})
