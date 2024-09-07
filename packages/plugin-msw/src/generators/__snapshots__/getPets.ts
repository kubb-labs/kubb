export const getPets = http.get('*/pets', function handler(info) {
  return new Response(JSON.stringify(getPets()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
