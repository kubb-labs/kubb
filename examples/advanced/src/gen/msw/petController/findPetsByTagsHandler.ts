import { http } from 'msw'
import { createFindPetsByTagsQueryResponse } from '../../mocks/petController/createFindPetsByTags'

export const findPetsByTagsHandler = http.get('*/pet/findByTags', function handler(info) {
  return new Response(JSON.stringify(createFindPetsByTagsQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
