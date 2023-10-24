import { http } from 'msw'

import { createPlaceOrderPatchMutationResponse } from '../../mocks/storeMocks/createPlaceOrderPatch'

export const placeOrderPatchHandler = http.patch('*/store/order', function handler(info) {
  return new Response(JSON.stringify(createPlaceOrderPatchMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
