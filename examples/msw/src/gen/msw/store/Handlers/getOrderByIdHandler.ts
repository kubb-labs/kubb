import type { GetOrderByIdQueryResponse } from '../../../models/GetOrderById.ts'
import { http } from 'msw'

export function getOrderByIdHandler(data?: GetOrderByIdQueryResponse) {
  return http.get('*/store/order/:orderId', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
