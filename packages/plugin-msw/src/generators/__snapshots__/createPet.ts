export const createPet = http.post('*/pets', function handler(info) {
  return new Response(JSON.stringify(createPet()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
