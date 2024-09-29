import { createUpdateUserMutationResponseFaker } from '../../mocks/userController/createUpdateUserFaker.js'
import { http } from 'msw'

export const updateUserHandler = http.put('*/user/:username', function handler(info) {
  return new Response(JSON.stringify(createUpdateUserMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
