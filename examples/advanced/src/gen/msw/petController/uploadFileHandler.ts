import { rest } from 'msw'
import { createUploadFileMutationResponse, createUploadFileMutationRequest } from '../../mocks/petController/createUploadFile'

export const uploadFileHandler = rest.post('*/pet/:petId/uploadImage', function handler(req, res, ctx) {
  return res(ctx.json(createUploadFileMutationResponse()))
})
