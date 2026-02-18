import process from 'node:process'
import type { HealthResponse } from '@kubb/core'
import { version } from '~~/package.json'

/**
 * `GET /api/health`
 *
 * Returns the current health status of the agent server, including its version
 * and the config file it was started with.
 */
export default defineEventHandler(async (): Promise<HealthResponse> => {
  return {
    status: 'ok',
    version,
    configPath: process.env.KUBB_CONFIG || '',
  }
})
