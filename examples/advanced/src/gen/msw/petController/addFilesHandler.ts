import { http } from 'msw'
import type { AddFilesResponseData, AddFilesStatus405 } from '../../models/ts/petController/AddFiles.ts'

export function addFilesHandlerResponse200(data: AddFilesResponseData) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addFilesHandlerResponse405(data?: AddFilesStatus405) {
  return new Response(JSON.stringify(data), {
    status: 405,
  })
}

export function addFilesHandler(data?: AddFilesResponseData | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>)) {
  return http.post('/pet/files', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
