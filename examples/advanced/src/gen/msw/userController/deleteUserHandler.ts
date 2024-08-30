import { createDeleteUserMutationResponse } from '../../mocks/userController/createDeleteUser.ts'
import { http } from 'msw'

export const deleteUserHandler = http.delete('*/user/:username', function handler(info) {
  return new Response(JSON.stringify(createDeleteUserMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
