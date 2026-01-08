import type { FindPetsByTagsResponseData2, FindPetsByTagsStatus4002 } from '../../models/ts/petController/FindPetsByTags.ts'
import { http } from 'msw'

export function findPetsByTagsHandlerResponse200(data: FindPetsByTagsResponseData2) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function findPetsByTagsHandlerResponse400(data?: FindPetsByTagsStatus4002) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function findPetsByTagsHandler(
  data?: FindPetsByTagsResponseData2 | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
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
