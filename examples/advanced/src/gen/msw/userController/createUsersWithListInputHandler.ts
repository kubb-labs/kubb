import { createCreateUsersWithListInputMutationResponseFaker } from '../../mocks/userController/createCreateUsersWithListInputFaker.ts'
import { http } from 'msw'

export const createUsersWithListInputHandler = http.post('*/user/createWithList', function handler(info) {
  return new Response(JSON.stringify(createCreateUsersWithListInputMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
