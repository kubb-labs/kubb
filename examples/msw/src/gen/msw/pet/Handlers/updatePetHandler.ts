import type { UpdatePetMutationResponse } from '../../../models/UpdatePet.ts'
import { http } from 'msw'

export function updatePetHandler(data?: UpdatePetMutationResponse | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Response)) {
  return http.put('http://localhost:3000/pet', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
