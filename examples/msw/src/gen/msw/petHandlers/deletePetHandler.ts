import { rest } from 'msw'
import { createDeletePetMutationResponse } from '../../mocks/petMocks/createDeletePet'

export const deletePetHandler = rest.delete('*/pet/:petId', function handler(req, res, ctx) {
  return res(
    ctx.json(createDeletePetMutationResponse()),
  )
})
