import type { FindPetsByStatusQueryResponse, FindPetsByStatus400 } from '../../models/ts/petController/FindPetsByStatus.ts'
import { http } from 'msw'

export function findPetsByStatusHandlerResponse200(data: FindPetsByStatusQueryResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function findPetsByStatusHandlerResponse400(data?: FindPetsByStatus400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function findPetsByStatusHandler(
  data?: FindPetsByStatusQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
) {
  return http.get('/pet/findByStatus/:step_id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
