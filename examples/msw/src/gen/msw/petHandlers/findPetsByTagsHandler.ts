import { createFindPetsByTagsQueryResponse } from '../../mocks/petMocks/createFindPetsByTags.ts'
import { http } from 'msw'

export const findPetsByTagsHandler = http.get('*/pet/findByTags', function handler(info) {
  return new Response(JSON.stringify(createFindPetsByTagsQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
