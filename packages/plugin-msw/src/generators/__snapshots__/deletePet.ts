import { http } from 'msw'

export function deletePetsPetid(data?: DeletePetsPetidMutationResponse | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response)) {
  return http.delete('/pets/:petId', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
