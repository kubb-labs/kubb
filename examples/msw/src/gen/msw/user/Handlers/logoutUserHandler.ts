/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import type { LogoutUserQueryResponse } from '../../../models/LogoutUser.ts'
import { http } from 'msw'

export function logoutUserHandler(data?: LogoutUserQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('http://localhost:3000/user/logout', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
