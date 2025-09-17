import type { PartsControllerDownloadPartMutationResponse } from '../../models/ts/partsController/PartsControllerDownloadPart.ts'
import { http } from 'msw'

export function partsControllerDownloadPartHandler(
  data?: PartsControllerDownloadPartMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/parts/:urn/download', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
