import { http } from 'msw'
import type { DeletePet400 } from '../../models/ts/petController/DeletePet.ts'

export function deletePetHandlerResponse400(data?: DeletePet400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function deletePetHandler(
  data?: string | number | boolean | null | object | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response | Promise<Response>),
) {
  return http.delete('/pet/:petId\\\\:search', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
