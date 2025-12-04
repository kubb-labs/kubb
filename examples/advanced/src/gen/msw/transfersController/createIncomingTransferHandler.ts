import { http } from 'msw'
import type { CreateIncomingTransferMutationResponse } from '../../models/ts/transfersController/CreateIncomingTransfer.ts'

export function createIncomingTransferHandlerResponse200(data: CreateIncomingTransferMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function createIncomingTransferHandler(
  data?: CreateIncomingTransferMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>),
) {
  return http.post('/v1/incoming_transfers', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
