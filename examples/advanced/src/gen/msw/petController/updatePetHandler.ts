import type { UpdatePetResponseData2, UpdatePetStatus4002, UpdatePetStatus4042, UpdatePetStatus4052 } from '../../models/ts/petController/UpdatePet.ts'
import { http } from 'msw'

export function updatePetHandlerResponse200(data: UpdatePetResponseData2) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse202(data: UpdatePetResponseData2) {
  return new Response(JSON.stringify(data), {
    status: 202,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse400(data?: UpdatePetStatus4002) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function updatePetHandlerResponse404(data?: UpdatePetStatus4042) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function updatePetHandlerResponse405(data?: UpdatePetStatus4052) {
  return new Response(JSON.stringify(data), {
    status: 405,
  })
}

export function updatePetHandler(data?: UpdatePetResponseData2 | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Response | Promise<Response>)) {
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
