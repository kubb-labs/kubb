import type { CreateUsersWithListInputMutationResponse } from '../../../models/CreateUsersWithListInput.ts'
import { http } from 'msw'

export function createUsersWithListInputHandler(
  data?: CreateUsersWithListInputMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('http://localhost:3000/user/createWithList', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
