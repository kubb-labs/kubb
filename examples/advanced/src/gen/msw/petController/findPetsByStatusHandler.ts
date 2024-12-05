import { http } from 'msw'
import type { FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus.ts'

export function findPetsByStatusHandler(data?: FindPetsByStatusQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('*/pet/findByStatus/:step_id', function handler(info) {
    if (typeof data === 'function') return data(info)
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
