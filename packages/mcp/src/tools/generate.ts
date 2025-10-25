import { type Config, type Plugin, safeBuild } from '@kubb/core'
import { createFile, FileProcessor } from '@kubb/fabric-core'
import { type Include, pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.d.ts'
import type { z } from 'zod'
import type { generateSchema } from '../schemas/generateSchema.ts'

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

    const { app, error } = await safeBuild({
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

    const promises = app.files.map(async (file) => {
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
