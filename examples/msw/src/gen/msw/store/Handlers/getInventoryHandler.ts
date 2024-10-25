import type { GetInventoryQueryResponse } from '../../../models/GetInventory.ts'
import { http } from 'msw'

export function getInventoryHandler(data?: GetInventoryQueryResponse) {
  return http.get('*/store/inventory', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
