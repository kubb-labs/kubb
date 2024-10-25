import type { GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName.ts'
import { http } from 'msw'

export function getUserByNameHandler(data?: GetUserByNameQueryResponse) {
  return http.get('*/user/:username', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
