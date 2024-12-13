import type { DeleteOrderMutationResponse } from '../../../models/DeleteOrder.ts'
import { http } from 'msw'

export function deleteOrderHandler(data?: DeleteOrderMutationResponse | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response)) {
  return http.delete('*/store/order/:orderId', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
