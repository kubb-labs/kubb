import type { DeleteUserMutationResponse } from '../../../models/DeleteUser.ts'
import { http } from 'msw'

export function deleteUserHandler(data?: DeleteUserMutationResponse | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response)) {
  return http.delete('*/user/:username', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
