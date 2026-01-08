import { http } from 'msw'
import type { FindPetsByTagsResponseData, FindPetsByTagsStatus400 } from '../../models/ts/petController/FindPetsByTags.ts'

export function findPetsByTagsHandlerResponse200(data: FindPetsByTagsResponseData) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function findPetsByTagsHandlerResponse400(data?: FindPetsByTagsStatus400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function findPetsByTagsHandler(
  data?: FindPetsByTagsResponseData | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
) {
  return http.get('/pet/findByTags', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
