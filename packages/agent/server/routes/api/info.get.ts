import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { InfoResponse } from '@kubb/core'
import { serializePluginOptions } from '@kubb/core/utils'
import { defineEventHandler } from 'h3'
import { useKubbAgentContext } from '../../utils/useKubbAgentContext.ts'

export default defineEventHandler(async (): Promise<InfoResponse> => {
  const context = useKubbAgentContext()
  const { config } = context

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
    version: '4.23.0',
    configPath: process.cwd(),
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
