import type { UpdatePetMutationResponse } from '../../models/ts/petController/UpdatePet.ts'
import { http } from 'msw'

export function updatePetHandler(data?: UpdatePetMutationResponse) {
  return http.put('*/pet', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
