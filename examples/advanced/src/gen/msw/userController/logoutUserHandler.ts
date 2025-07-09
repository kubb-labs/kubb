import type { LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'
import { http } from 'msw'

export function logoutUserHandler(data?: LogoutUserQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('/user/logout', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
