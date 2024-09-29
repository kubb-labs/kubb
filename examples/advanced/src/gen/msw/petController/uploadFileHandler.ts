import { createUploadFileMutationResponseFaker } from '../../mocks/petController/createUploadFileFaker.ts'
import { http } from 'msw'

export const uploadFileHandler = http.post('*/pet/:petId/uploadImage', function handler(info) {
  return new Response(JSON.stringify(createUploadFileMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
