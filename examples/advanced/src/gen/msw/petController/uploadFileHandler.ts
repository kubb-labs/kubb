import { rest } from 'msw'
import { createUploadfilemutationresponse, createUploadfilemutationrequest } from '../../mocks/petController/createUploadfile'

export const uploadfileHandler = rest.post('*/pet/:petId/uploadImage', function handler(req, res, ctx) {
  return res(ctx.json(createUploadfilemutationresponse()))
})
