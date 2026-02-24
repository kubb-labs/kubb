import { version } from '~~/package.json'

/**
 * `GET /api/health`
 *
 * Returns the current health status of the agent server, including its version
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    version,
  }
})
