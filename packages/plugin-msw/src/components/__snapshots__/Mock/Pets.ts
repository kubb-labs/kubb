export const createPets = http.post('*/pets', function handler(info) {
    return new Response(JSON.stringify(CreatePetsMutationResponse()), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })