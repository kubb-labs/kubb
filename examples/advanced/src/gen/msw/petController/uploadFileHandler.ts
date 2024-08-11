import { http } from 'msw'
import { createUploadFileMutationResponse } from '../../mocks/petController/createUploadFile'

export const uploadFileHandler = http.post('*/pet/:petId/uploadImage', function handler(info) {
  return new Response(JSON.stringify(createUploadFileMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
