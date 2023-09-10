import { rest } from 'msw'
import { createAddPetMutationResponse } from '../../mocks/petController/createAddPet'

export const mockAddPetHandler = rest.get('*/pet', function handler(req, res, ctx) {
  return res(ctx.json(createAddPetMutationResponse()))
})
