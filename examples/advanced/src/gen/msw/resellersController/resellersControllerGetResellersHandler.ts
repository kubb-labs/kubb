import type { ResellersControllerGetResellersQueryResponse } from '../../models/ts/resellersController/ResellersControllerGetResellers.ts'
import { http } from 'msw'

export function resellersControllerGetResellersHandler(
  data?: ResellersControllerGetResellersQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/resellers', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
