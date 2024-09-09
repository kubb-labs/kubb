import { http } from 'msw'

export const listPets = http.get('*/pets', function handler(info) {
  return new Response(JSON.stringify(listPetsQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
