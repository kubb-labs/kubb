import { rest } from 'msw'
import { createDeletePetMutationResponse } from '../../mocks/petMocks/createDeletePet'

export const mockDeletePetHandler = rest.get('*/pet/:petId', function handler(req, res, ctx) {
  return res(ctx.json(createDeletePetMutationResponse()))
})
