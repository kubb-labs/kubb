import type { AddFilesMutationResponse, AddFiles405 } from "../../models/ts/petController/AddFiles.ts";
import { http } from "msw";

export function addFilesHandlerResponse200(data: AddFilesMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
      headers: {
      'Content-Type': 'application/json'
    },
  })
}

export function addFilesHandlerResponse405(data?: AddFiles405) {
  return new Response(JSON.stringify(data), {
    status: 405,
  
  })
}

export function addFilesHandler(data?: AddFilesMutationResponse | ((
        info: Parameters<Parameters<typeof http.post>[1]>[0],
      ) => Response | Promise<Response>)) {
  return http.post('/pet/files', function handler(info) {
    if(typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
        headers: {
        'Content-Type': 'application/json'
      },
    })
  })
}