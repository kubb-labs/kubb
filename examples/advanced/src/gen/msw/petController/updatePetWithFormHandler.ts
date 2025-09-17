import type { UpdatePetWithFormMutationResponse } from '../../models/ts/petController/UpdatePetWithForm.ts'
import { http } from 'msw'

export function updatePetWithFormHandler(data?: UpdatePetWithFormMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response)) {
  return http.post('/pet/:petId\\\\:search', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
