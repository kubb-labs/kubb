import { rest } from 'msw'
import { createUpdatePetMutationResponse } from '../../mocks/petMocks/createUpdatePet'

export const updatePetHandler = rest.put('*/pet', function handler(req, res, ctx) {
  return res(
    ctx.json(createUpdatePetMutationResponse()),
  )
})
