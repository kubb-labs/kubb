import type { GetPetByIdResponseData2, GetPetByIdStatus4002, GetPetByIdStatus4042 } from '../../models/ts/petController/GetPetById.ts'
import { http } from 'msw'

export function getPetByIdHandlerResponse200(data: GetPetByIdResponseData2) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getPetByIdHandlerResponse400(data?: GetPetByIdStatus4002) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function getPetByIdHandlerResponse404(data?: GetPetByIdStatus4042) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function getPetByIdHandler(data?: GetPetByIdResponseData2 | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>)) {
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
