import type { ResellersControllerGetResellerQueryResponse } from '../../models/ts/resellersController/ResellersControllerGetReseller.ts'
import { http } from 'msw'

export function resellersControllerGetResellerHandler(
  data?: ResellersControllerGetResellerQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/resellers/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
