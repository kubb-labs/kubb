import { http } from 'msw'
import type { CreateTransferMutationResponse } from '../../models/ts/transfersController/CreateTransfer.ts'

export function createTransferHandlerResponse200(data: CreateTransferMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function createTransferHandler(
  data?: CreateTransferMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>),
) {
  return http.post('/v1/transfers', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
