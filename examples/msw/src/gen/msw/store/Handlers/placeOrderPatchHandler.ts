import type { PlaceOrderPatchMutationResponse } from '../../../models/PlaceOrderPatch.ts'
import { http } from 'msw'

export function placeOrderPatchHandler(data?: PlaceOrderPatchMutationResponse) {
  return http.patch('*/store/order', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
