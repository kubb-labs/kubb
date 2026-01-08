import { http } from 'msw'
import type { UpdatePetResponseData, UpdatePetStatus400, UpdatePetStatus404, UpdatePetStatus405 } from '../../models/ts/petController/UpdatePet.ts'

export function updatePetHandlerResponse200(data: UpdatePetResponseData) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse202(data: UpdatePetResponseData) {
  return new Response(JSON.stringify(data), {
    status: 202,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse400(data?: UpdatePetStatus400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function updatePetHandlerResponse404(data?: UpdatePetStatus404) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function updatePetHandlerResponse405(data?: UpdatePetStatus405) {
  return new Response(JSON.stringify(data), {
    status: 405,
  })
}

export function updatePetHandler(data?: UpdatePetResponseData | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Response | Promise<Response>)) {
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
