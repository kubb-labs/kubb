import { createGetInventoryQueryResponse } from '../../../mocks/storeController/createGetInventory.ts'
import { http } from 'msw'

export const getInventoryHandler = http.get('*/store/inventory', function handler(info) {
  return new Response(JSON.stringify(createGetInventoryQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
