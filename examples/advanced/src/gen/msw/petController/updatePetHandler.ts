import { http } from 'msw'
import type { UpdatePet400, UpdatePet404, UpdatePet405, UpdatePetMutationResponse } from '../../models/ts/petController/UpdatePet.ts'

export function updatePetHandlerResponse200(data: UpdatePetMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse202(data: UpdatePetMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 202,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse400(data?: UpdatePet400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function updatePetHandlerResponse404(data?: UpdatePet404) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function updatePetHandlerResponse405(data?: UpdatePet405) {
  return new Response(JSON.stringify(data), {
    status: 405,
  })
}

export function updatePetHandler(data?: UpdatePetMutationResponse | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Response | Promise<Response>)) {
  return http.put('/pet', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
