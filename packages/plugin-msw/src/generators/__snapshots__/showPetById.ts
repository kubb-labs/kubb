import { http } from 'msw'

export const showPetById = http.get('*/pets/:petId', function handler(info) {
  return new Response(JSON.stringify(showPetByIdQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
