import type { CreateUserMutationResponse } from '../../models/ts/userController/CreateUser.ts'
import { http } from 'msw'

export function createUserHandler(
  data?: CreateUserMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>),
) {
  return http.post('/user', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
