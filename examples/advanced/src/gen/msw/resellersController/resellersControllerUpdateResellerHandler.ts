import type { ResellersControllerUpdateResellerMutationResponse } from '../../models/ts/resellersController/ResellersControllerUpdateReseller.ts'
import { http } from 'msw'

export function resellersControllerUpdateResellerHandler(
  data?: ResellersControllerUpdateResellerMutationResponse | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Response),
) {
  return http.patch('/api/resellers/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
