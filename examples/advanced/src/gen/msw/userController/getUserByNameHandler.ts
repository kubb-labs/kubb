import { createGetUserByNameQueryResponseFaker } from '../../mocks/userController/createGetUserByNameFaker.js'
import { http } from 'msw'

export const getUserByNameHandler = http.get('*/user/:username', function handler(info) {
  return new Response(JSON.stringify(createGetUserByNameQueryResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
