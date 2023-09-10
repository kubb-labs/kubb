import { rest } from 'msw'
import { createUploadFileMutationResponse, createUploadFileMutationRequest } from '../../mocks/petMocks/createUploadFile'

export const mockUploadFileHandler = rest.get('*/pet/:petId/uploadImage', function handler(req, res, ctx) {
  return res(ctx.json(createUploadFileMutationResponse()))
})
