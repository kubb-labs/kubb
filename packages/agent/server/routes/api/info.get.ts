import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { serializePluginOptions } from '@kubb/core/utils'
import { defineEventHandler, HTTPError } from 'h3'

import type { InfoResponse } from '../../utils/types.ts'

export default defineEventHandler(async (event): Promise<InfoResponse> => {
  const context = globalThis.__KUBB_AGENT_CONTEXT__ as any
  if (!context) {
    throw new HTTPError({ statusCode: 500, statusMessage: 'Server context not initialized' })
  }

  event.res.headers.set('Content-Type', 'application/json')

  const { config, configPath, version } = context

  // Read OpenAPI spec if available
  let specContent: string | undefined
  if (config && 'path' in config.input) {
    const specPath = path.resolve(process.cwd(), config.root, config.input.path)
    try {
      specContent = readFileSync(specPath, 'utf-8')
    } catch {
      // Spec file not found or unreadable
    }
  }

  return {
    version,
    configPath: path.relative(process.cwd(), configPath),
    spec: specContent,
    config: {
      name: config.name,
      root: config.root,
      input: {
        path: 'path' in config.input ? config.input.path : undefined,
      },
      output: {
        path: config.output.path,
        write: config.output.write,
        extension: config.output.extension,
        barrelType: config.output.barrelType,
      },
      plugins: config.plugins?.map((plugin: any) => ({
        name: `@kubb/${plugin.name}`,
        options: serializePluginOptions(plugin.options),
      })),
    },
  }
})
