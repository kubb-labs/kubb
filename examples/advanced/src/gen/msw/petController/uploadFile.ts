import { rest } from 'msw'
import { createUploadFileMutationResponse } from '../../mocks/petController/createUploadFile'

export const uploadFileHandler = rest.get('*/pet/:petId/uploadImage', function handler(req, res, ctx) {
  return res(ctx.json(createUploadFileMutationResponse()))
})
