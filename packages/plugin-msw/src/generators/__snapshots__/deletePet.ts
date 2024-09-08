export const deletePet = http.delete('*/pets/:petId', function handler(info) {
  return new Response(JSON.stringify(deletePet()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
