import type { FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags.ts'
import { http } from 'msw'

export function findPetsByTagsHandler(data?: FindPetsByTagsQueryResponse) {
  return http.get('*/pet/findByTags', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
