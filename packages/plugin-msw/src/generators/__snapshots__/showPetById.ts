export const showPetById = http.get('*/pets/:petId', function handler(info) {
  return new Response(JSON.stringify(showPetById()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
