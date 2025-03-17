import type { UpdateUserMutationResponse } from '../../../models/UpdateUser.ts'
import { http } from 'msw'

export function updateUserHandler(data?: UpdateUserMutationResponse | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Response)) {
  return http.put('http://localhost:3000/user/:username', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
