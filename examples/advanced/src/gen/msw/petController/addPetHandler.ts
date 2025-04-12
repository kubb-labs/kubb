import type { AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'
import { http } from 'msw'

export function addPetHandler(data?: AddPetMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response)) {
  return http.post('/pet', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
