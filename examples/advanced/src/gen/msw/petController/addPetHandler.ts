import type { AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'
import { http } from 'msw'

export function addPetHandler(data?: AddPetMutationResponse) {
  return http.post('*/pet', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
