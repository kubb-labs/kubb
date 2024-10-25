import type { UpdatePetWithFormMutationResponse } from '../../models/ts/petController/UpdatePetWithForm.ts'
import { http } from 'msw'

export function updatePetWithFormHandler(data?: UpdatePetWithFormMutationResponse) {
  return http.post('*/pet/:petId', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
