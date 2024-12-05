import type { GetOrderByIdQueryResponse } from '../../../models/GetOrderById.ts'
import { http } from 'msw'

export function getOrderByIdHandler(data?: GetOrderByIdQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('*/store/order/:orderId', function handler(info) {
    if (typeof data === 'function') return data(info)
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
