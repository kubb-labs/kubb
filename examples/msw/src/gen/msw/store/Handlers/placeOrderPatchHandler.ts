import type { PlaceOrderPatchMutationResponse } from '../../../models/PlaceOrderPatch.ts'
import { http } from 'msw'

export function placeOrderPatchHandler(data?: PlaceOrderPatchMutationResponse | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Response)) {
  return http.patch('http://localhost:3000/store/order', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
