import { createDeleteUserMutationResponseFaker } from '../../mocks/userController/createDeleteUserFaker.js'
import { http } from 'msw'

export const deleteUserHandler = http.delete('*/user/:username', function handler(info) {
  return new Response(JSON.stringify(createDeleteUserMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
