import { rest } from 'msw'
import { createGetPetByIdQueryResponse } from '../../mocks/petMocks/createGetPetById'

export const mockGetPetByIdHandler = rest.get('*/pet/:petId', function handler(req, res, ctx) {
  return res(ctx.json(createGetPetByIdQueryResponse()))
})
