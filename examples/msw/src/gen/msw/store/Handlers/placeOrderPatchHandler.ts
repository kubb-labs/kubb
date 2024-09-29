import { createPlaceOrderPatchMutationResponse } from '../../../mocks/storeController/createPlaceOrderPatch.ts'
import { http } from 'msw'

export const placeOrderPatchHandler = http.patch('*/store/order', function handler(info) {
  return new Response(JSON.stringify(createPlaceOrderPatchMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
