import type { AddPetMutationResponse, AddPet405 } from '../../models/ts/petController/AddPet.ts'
import { http } from 'msw'

export function addPetHandlerResponse200(data: AddPetMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addPetHandlerResponse405(data: AddPet405) {
  return new Response(JSON.stringify(data), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addPetHandler(data?: AddPetMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>)) {
  return http.post('/pet', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
