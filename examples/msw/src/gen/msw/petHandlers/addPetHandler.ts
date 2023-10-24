import { rest } from 'msw'

import { createAddPetMutationResponse } from '../../mocks/petMocks/createAddPet'

export const addPetHandler = rest.post('*/pet', function handler(req, res, ctx) {
  return res(
    ctx.json(createAddPetMutationResponse()),
  )
})
