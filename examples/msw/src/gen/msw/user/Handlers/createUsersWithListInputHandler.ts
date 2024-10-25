import type { CreateUsersWithListInputMutationResponse } from '../../../models/CreateUsersWithListInput.ts'
import { http } from 'msw'

export function createUsersWithListInputHandler(data?: CreateUsersWithListInputMutationResponse) {
  return http.post('*/user/createWithList', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
