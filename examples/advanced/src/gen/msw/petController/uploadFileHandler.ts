import { rest } from 'msw'
import { createUploadFileMutationResponse } from '../../mocks/petController/createUploadFile'

export const uploadFileHandler = rest.post('*/pet/:petId/uploadImage', function handler(req, res, ctx) {
  return res(
    ctx.json(createUploadFileMutationResponse()),
  )
})
