import { rest } from 'msw'
import { createAddPetMutationResponse, createAddPetMutationRequest } from '../../mocks/petMocks/createAddPet'

export const addPetHandler = rest.get('*/pet', function handler(req, res, ctx) {
  return res(ctx.json(createAddPetMutationResponse()))
})
