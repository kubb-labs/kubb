import type { DeletePetMutationResponse } from '../../../models/DeletePet.ts'
import { http } from 'msw'

export function deletePetHandler(data?: DeletePetMutationResponse) {
  return http.delete('*/pet/:petId', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
