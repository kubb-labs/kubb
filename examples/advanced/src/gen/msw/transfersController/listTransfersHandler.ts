import type {
  ListTransfersQueryResponse,
  ListTransfers400,
  ListTransfers401,
  ListTransfers403,
  ListTransfers500,
} from '../../models/ts/transfersController/ListTransfers.ts'
import { http } from 'msw'

export function listTransfersHandlerResponse200(data: ListTransfersQueryResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function listTransfersHandlerResponse400(data?: ListTransfers400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function listTransfersHandlerResponse401(data?: ListTransfers401) {
  return new Response(JSON.stringify(data), {
    status: 401,
  })
}

export function listTransfersHandlerResponse403(data?: ListTransfers403) {
  return new Response(JSON.stringify(data), {
    status: 403,
  })
}

export function listTransfersHandlerResponse500(data?: ListTransfers500) {
  return new Response(JSON.stringify(data), {
    status: 500,
  })
}

export function listTransfersHandler(
  data?: ListTransfersQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
) {
  return http.get('/v1/transfers', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
