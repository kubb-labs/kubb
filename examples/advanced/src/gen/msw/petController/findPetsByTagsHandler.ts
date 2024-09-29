import { createFindPetsByTagsQueryResponseFaker } from '../../mocks/petController/createFindPetsByTagsFaker.ts'
import { http } from 'msw'

export const findPetsByTagsHandler = http.get('*/pet/findByTags', function handler(info) {
  return new Response(JSON.stringify(createFindPetsByTagsQueryResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
