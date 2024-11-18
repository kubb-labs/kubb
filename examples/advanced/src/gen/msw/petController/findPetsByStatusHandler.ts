import type { FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus.ts'
import { http } from 'msw'

export function findPetsByStatusHandler(data?: FindPetsByStatusQueryResponse) {
  return http.get('*/pet/findByStatus/:step_id', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
