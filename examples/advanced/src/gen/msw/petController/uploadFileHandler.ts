import { http } from 'msw'
import type { UploadFileResponseData } from '../../models/ts/petController/UploadFile.ts'

export function uploadFileHandlerResponse200(data: UploadFileResponseData) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function uploadFileHandler(data?: UploadFileResponseData | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>)) {
  return http.post('/pet/:petId/uploadImage', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
