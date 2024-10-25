import type { GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById.ts'
import { http } from 'msw'

export function getPetByIdHandler(data?: GetPetByIdQueryResponse) {
  return http.get('*/pet/:petId', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
