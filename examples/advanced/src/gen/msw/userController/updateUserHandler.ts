import { http } from 'msw'
import { createUpdateUserMutationResponse } from '../../mocks/userController/createUpdateUser'

export const updateUserHandler = http.put('*/user/:username', function handler(info) {
  return new Response(JSON.stringify(createUpdateUserMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
