import { rest } from 'msw'
import { createUpdatePetWithFormMutationResponse } from '../../mocks/petMocks/createUpdatePetWithForm'

export const updatePetWithFormHandler = rest.post('*/pet/:petId', function handler(req, res, ctx) {
  return res(
    ctx.json(createUpdatePetWithFormMutationResponse()),
  )
})
