import { z } from '@hono/zod-openapi'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import type { AddressInfo } from 'node:net'
import type { PluginManager } from '@kubb/core'

const StatusSchema = z
  .object({
    percentage: z.number(),
    executed: z.array(z.any()),
  })
  .openapi('User')

const route = createRoute({
  method: 'get',
  path: '/status',
  response: {},
  responses: {
    200: {
      content: {
        'application/json': {
          schema: StatusSchema,
        },
      },
      description: 'Retrieve the status',
    },
  },
})

type Options = {
  getPercentage: () => number
  pluginManager: PluginManager
}

export async function startServer(options: Options, listeningListener?: (info: AddressInfo) => void) {
  const { pluginManager, getPercentage } = options
  const app = new OpenAPIHono()
  const executed = new Set()

  pluginManager.events.on('executing', ({ plugin, hookName }) => {
    executed.add({
      hookName,
      pluginName: plugin.name,
    })
  })

  app.openapi(route, (c) => {
    return c.json(
      {
        percentage: getPercentage(),
        executed: [...executed.values()],
      },
      200,
    )
  })

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Kubb ui',
    },
  })

  return serve(
    {
      fetch: app.fetch,
      port: 8787,
    },
    listeningListener,
  )
}
