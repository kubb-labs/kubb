import type { LoginUserQueryResponse } from '../../../models/LoginUser.ts'
import { http } from 'msw'

export function loginUserHandler(data?: LoginUserQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('*/user/login', function handler(info) {
    if (typeof data === 'function') return data(info)
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
