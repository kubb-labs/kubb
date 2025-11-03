import { http } from 'msw'
import type { GetPetById400, GetPetById404, GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById.ts'

export function getPetByIdHandlerResponse200(data: GetPetByIdQueryResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getPetByIdHandlerResponse400(data?: GetPetById400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function getPetByIdHandlerResponse404(data?: GetPetById404) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function getPetByIdHandler(data?: GetPetByIdQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>)) {
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
