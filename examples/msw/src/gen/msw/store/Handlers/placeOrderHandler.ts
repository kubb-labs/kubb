import type { PlaceOrderMutationResponse } from '../../../models/PlaceOrder.ts'
import { http } from 'msw'

export function placeOrderHandler(data?: PlaceOrderMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response)) {
  return http.post('http://localhost:3000/store/order', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
