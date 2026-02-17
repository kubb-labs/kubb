import path from 'node:path'
import process from 'node:process'
import type { HealthResponse } from '@kubb/core'
import { defineEventHandler, HTTPError } from 'h3'

export default defineEventHandler(async (event): Promise<HealthResponse> => {
  const context = globalThis.__KUBB_AGENT_CONTEXT__ as any
  if (!context) {
    throw new HTTPError({ statusCode: 500, statusMessage: 'Server context not initialized' })
  }

  event.res.headers.set('Content-Type', 'application/json')

  return {
    status: 'ok',
    version: context.version,
    configPath: path.relative(process.cwd(), context.configPath),
  }
})
