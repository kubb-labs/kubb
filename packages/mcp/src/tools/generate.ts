import { pluginTs } from '@kubb/plugin-ts'
import { type Include, pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'

import { type Config, safeBuild, type Plugin } from '@kubb/core'
import type { generateSchema } from '../schemas/generateSchema.ts'
import type { z } from 'zod'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.d.ts'
import { createFile, FileProcessor } from '@kubb/fabric-core'

export async function generate({ plugin, openApi, operationId }: z.infer<typeof generateSchema>): Promise<CallToolResult> {
  try {
    const include = [
      operationId
        ? {
            type: 'operationId',
            pattern: operationId,
          }
        : undefined,
    ].filter(Boolean) as Include[]

    const plugins = [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'typescript.ts',
        },
        generators: plugin === 'typescript' ? undefined : [],
        include,
      }),
      pluginReactQuery({
        output: {
          path: 'react-query.ts',
        },
        generators: plugin === 'react-query' ? undefined : [],
        include,
      }),
    ].filter(Boolean) as Plugin[]

    const fileProcessor = new FileProcessor()
    const definedConfig: Config = {
      root: process.cwd(),
      input: {
        data: openApi,
      },
      output: {
        path: './',
        write: false,
        barrelType: 'named',
      },
      plugins,
    }

    const { files, error } = await safeBuild({
      config: definedConfig,
    })

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: error.message,
          },
        ],
        isError: true,
      }
    }

    const promises = files.map(async (file) => {
      return fileProcessor.parse(createFile(file))
    })

    const sources = await Promise.all(promises)

    return {
      content: [
        // {
        //   type: 'resource',
        //   resource: {}
        // },
        {
          type: 'text',
          text: `Config: ${JSON.stringify(definedConfig, null, 2)}`,
        },
        {
          type: 'text',
          text: `Files: ${JSON.stringify(sources, null, 2)}`,
        },
      ],
    }
  } catch (e) {
    const error = e as Error

    return {
      content: [
        {
          type: 'text',
          text: error.message,
        },
      ],
      isError: true,
    }
  }
}
