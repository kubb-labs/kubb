import { createGetUserByNameQueryResponse } from '../../mocks/userMocks/createGetUserByName.ts'
import { http } from 'msw'

export const getUserByNameHandler = http.get('*/user/:username', function handler(info) {
  return new Response(JSON.stringify(createGetUserByNameQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
