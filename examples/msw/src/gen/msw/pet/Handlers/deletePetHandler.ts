import type { DeletePetMutationResponse } from '../../../models/DeletePet.ts'
import { http } from 'msw'

export function deletePetHandler(data?: DeletePetMutationResponse | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response)) {
  return http.delete('*/pet/:petId', function handler(info) {
    if (typeof data === 'function') return data(info)
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
