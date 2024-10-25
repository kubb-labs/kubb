import type { DeleteOrderMutationResponse } from '../../../models/DeleteOrder.ts'
import { http } from 'msw'

export function deleteOrderHandler(data?: DeleteOrderMutationResponse) {
  return http.delete('*/store/order/:orderId', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
