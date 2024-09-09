import { http } from 'msw'

export const deletePetsPetid = http.delete('*/pets/:petId', function handler(info) {
  return new Response(JSON.stringify(deletePetsPetidMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
