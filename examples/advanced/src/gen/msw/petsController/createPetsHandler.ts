import { rest } from 'msw'
import { createCreatePetsMutationResponse } from '../../mocks/petsController/createCreatePets'

export const createPetsHandler = rest.post('*/pets/:uuid', function handler(req, res, ctx) {
  return res(ctx.json(createCreatePetsMutationResponse()))
})
