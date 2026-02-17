import process from 'node:process'
import type { HealthResponse } from '@kubb/core'
import { defineEventHandler } from 'h3'
import { version } from '~~/package.json'

export default defineEventHandler(async (): Promise<HealthResponse> => {
  return {
    status: 'ok',
    version,
    configPath: process.env.KUBB_CONFIG || '',
  }
})
