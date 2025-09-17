import type { ResellersControllerCreateResellerMutationResponse } from '../../models/ts/resellersController/ResellersControllerCreateReseller.ts'
import { http } from 'msw'

export function resellersControllerCreateResellerHandler(
  data?: ResellersControllerCreateResellerMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/resellers', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
