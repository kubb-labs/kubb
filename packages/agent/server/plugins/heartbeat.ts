import process from 'node:process'
import { logger } from '~/utils/logger.ts'
import { maskedString } from '~/utils/maskedString.ts'

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000

/**
 * Nitro plugin that sends a periodic HTTP GET to `KUBB_AGENT_HEARTBEAT_URL`
 * every 5 minutes to signal the agent is still alive.
 *
 * This is intended for use with uptime-monitoring services such as
 * Healthchecks.io, BetterUptime or UptimeRobot — set `KUBB_AGENT_HEARTBEAT_URL`
 * to the ping URL provided by your monitoring service.
 *
 * The timer is cleared when the Nitro server closes.
 */
export default defineNitroPlugin((nitro) => {
  const heartbeatUrl = process.env.KUBB_AGENT_HEARTBEAT_URL

  if (!heartbeatUrl) {
    return
  }

  const maskedUrl = maskedString(heartbeatUrl)

  const timer = setInterval(async () => {
    try {
      await $fetch(heartbeatUrl, { method: 'GET' })
      logger.info(`Heartbeat sent to ${maskedUrl}`)
    } catch (error: any) {
      logger.warn(`Failed to send heartbeat to ${maskedUrl}`, error?.message)
    }
  }, HEARTBEAT_INTERVAL_MS)

  nitro.hooks.hook('close', () => {
    clearInterval(timer)
  })
})
