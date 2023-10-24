import { encodeBuffer } from '@mswjs/interceptors'
import express from 'express'
import { Headers } from 'headers-polyfill'
import { handleRequest } from 'msw'
import { setupServer } from 'msw/node'
import { Emitter } from 'strict-event-emitter'

import { handlers } from './gen/index'

import type { RequestHandler as ExpressMiddleware } from 'express'
import type { HttpHandler, LifeCycleEventsMap, RequestHandler } from 'msw'

const emitter = new Emitter<LifeCycleEventsMap>()

export function createMiddleware(
  ...handlers: RequestHandler[]
): ExpressMiddleware {
  return async (req, res, next) => {
    const serverOrigin = `${req.protocol}://${req.get('host')}`

    // Ensure the request body input passed to the MockedRequest
    // is always a string. Custom middleware like "express.json()"
    // may coerce "req.body" to be an Object.
    const requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

    const mockedRequest = new Request(
      // Treat all relative URLs as the ones coming from the server.
      new URL(req.url, serverOrigin),
      {
        method: req.method,
        headers: new Headers(req.headers as HeadersInit),
        credentials: 'omit',
        body: encodeBuffer(requestBody),
      },
    )

    await handleRequest(
      mockedRequest,
      '1',
      handlers,
      {
        onUnhandledRequest: () => null,
      },
      emitter,
      {
        resolutionContext: {
          /**
           * @note Resolve relative request handler URLs against
           * the server's origin (no relative URLs in Node.js).
           */
          baseUrl: serverOrigin,
        },
        onMockedResponse: async (mockedResponse) => {
          const { status, statusText, headers } = mockedResponse

          res.statusCode = status
          res.statusMessage = statusText

          headers.forEach((value, name) => {
            res.setHeader(name, value)
          })

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const json = await mockedResponse.json()

          res.json(json)
        },
        onPassthroughResponse() {
          next()
        },
      },
    )
  }
}

function createServer(...handlers: HttpHandler[]) {
  const app = express()

  app.use(express.json())
  app.use(createMiddleware(...handlers))
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Mock not found',
    })
  })

  return app
}

const server = createServer(...handlers)

server.listen(9090, () => {
  console.log('Mock server ready at http://localhost:9090')
  console.log('\n\n')
  const mswServer = setupServer(...handlers)
  console.log(mswServer.listHandlers().map(item => item.info))
})
