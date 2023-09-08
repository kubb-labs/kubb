import { rest } from 'msw'
import { createUpdatePetMutationResponse, createUpdatePetMutationRequest } from '../../mocks/petMocks/createUpdatePet'

export const mockUpdatePetHandler = rest.get('*/pet', function handler(req, res, ctx) {
  return res(ctx.json(createUpdatePetMutationResponse()))
})
