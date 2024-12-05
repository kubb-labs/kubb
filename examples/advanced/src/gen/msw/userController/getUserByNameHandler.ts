import type { GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName.ts'
import { http } from 'msw'

export function getUserByNameHandler(data?: GetUserByNameQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('*/user/:username', function handler(info) {
    if (typeof data === 'function') return data(info)
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
