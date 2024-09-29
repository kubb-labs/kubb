import { createUploadFileMutationResponse } from '../../../mocks/petController/createUploadFile.ts'
import { http } from 'msw'

export const uploadFileHandler = http.post('*/pet/:petId/uploadImage', function handler(info) {
  return new Response(JSON.stringify(createUploadFileMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
