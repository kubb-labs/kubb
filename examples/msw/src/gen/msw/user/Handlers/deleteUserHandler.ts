import type { DeleteUserMutationResponse } from '../../../models/DeleteUser.ts'
import { http } from 'msw'

export function deleteUserHandler(data?: DeleteUserMutationResponse) {
  return http.delete('*/user/:username', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
