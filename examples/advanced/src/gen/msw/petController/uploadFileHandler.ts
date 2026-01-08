import type { UploadFileResponseData2 } from '../../models/ts/petController/UploadFile.ts'
import { http } from 'msw'

export function uploadFileHandlerResponse200(data: UploadFileResponseData2) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function uploadFileHandler(data?: UploadFileResponseData2 | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>)) {
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
