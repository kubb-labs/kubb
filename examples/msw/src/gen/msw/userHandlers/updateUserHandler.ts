import { createUpdateUserMutationResponse } from '../../mocks/userMocks/createUpdateUser.ts'
import { http } from 'msw'

export const updateUserHandler = http.put('*/user/:username', function handler(info) {
  return new Response(JSON.stringify(createUpdateUserMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
