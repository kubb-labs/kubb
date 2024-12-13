import { http } from 'msw'

export function listPets(data?: ListPetsQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('*/pets', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data || listPetsQueryResponse(data)), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
