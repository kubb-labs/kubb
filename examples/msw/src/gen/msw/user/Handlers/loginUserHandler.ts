import type { LoginUserQueryResponse } from '../../../models/LoginUser.ts'
import { http } from 'msw'

export function loginUserHandler(data?: LoginUserQueryResponse) {
  return http.get('*/user/login', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
