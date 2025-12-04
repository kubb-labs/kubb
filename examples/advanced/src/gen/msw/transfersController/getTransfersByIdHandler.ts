import { http } from 'msw'
import type {
  GetTransfersById400,
  GetTransfersById401,
  GetTransfersById403,
  GetTransfersById500,
  GetTransfersByIdQueryResponse,
} from '../../models/ts/transfersController/GetTransfersById.ts'

export function getTransfersByIdHandlerResponse200(data: GetTransfersByIdQueryResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getTransfersByIdHandlerResponse400(data?: GetTransfersById400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function getTransfersByIdHandlerResponse401(data?: GetTransfersById401) {
  return new Response(JSON.stringify(data), {
    status: 401,
  })
}

export function getTransfersByIdHandlerResponse403(data?: GetTransfersById403) {
  return new Response(JSON.stringify(data), {
    status: 403,
  })
}

export function getTransfersByIdHandlerResponse500(data?: GetTransfersById500) {
  return new Response(JSON.stringify(data), {
    status: 500,
  })
}

export function getTransfersByIdHandler(
  data?: GetTransfersByIdQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
) {
  return http.get('/v1/transfers/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
