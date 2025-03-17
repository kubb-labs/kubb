import type { FindPetsByStatusQueryResponse } from '../../../models/FindPetsByStatus.ts'
import { http } from 'msw'

export function findPetsByStatusHandler(data?: FindPetsByStatusQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('http://localhost:3000/pet/findByStatus', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
