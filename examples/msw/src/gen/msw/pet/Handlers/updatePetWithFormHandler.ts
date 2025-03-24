import type { UpdatePetWithFormMutationResponse } from '../../../models/UpdatePetWithForm.ts'
import { http } from 'msw'

export function updatePetWithFormHandler(data?: UpdatePetWithFormMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response)) {
  return http.post('http://localhost:3000/pet/:petId', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
