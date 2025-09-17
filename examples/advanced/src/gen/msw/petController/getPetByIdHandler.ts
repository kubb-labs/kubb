import type { GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById.ts'
import { http } from 'msw'

export function getPetByIdHandler(data?: GetPetByIdQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('/pet/:petId\\\\:search', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
