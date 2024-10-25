import type { UploadFileMutationResponse } from '../../../models/UploadFile.ts'
import { http } from 'msw'

export function uploadFileHandler(data?: UploadFileMutationResponse) {
  return http.post('*/pet/:petId/uploadImage', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
