/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import type { DeletePetMutationResponse } from '../../../models/DeletePet.ts'
import { http } from 'msw'

export function deletePetHandler(data?: DeletePetMutationResponse | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response)) {
  return http.delete('http://localhost:3000/pet/:petId\\\\:search', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
