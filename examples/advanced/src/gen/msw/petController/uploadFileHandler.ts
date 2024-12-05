import type { UploadFileMutationResponse } from '../../models/ts/petController/UploadFile.ts'
import { http } from 'msw'

export function uploadFileHandler(data?: UploadFileMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response)) {
  return http.post('*/pet/:petId/uploadImage', function handler(info) {
    if (typeof data === 'function') return data(info)
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
