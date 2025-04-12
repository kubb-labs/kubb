import type { FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags.ts'
import { http } from 'msw'

export function findPetsByTagsHandler(data?: FindPetsByTagsQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('/pet/findByTags', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
