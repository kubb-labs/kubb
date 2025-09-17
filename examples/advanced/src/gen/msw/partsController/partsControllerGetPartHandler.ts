import type { PartsControllerGetPartQueryResponse } from '../../models/ts/partsController/PartsControllerGetPart.ts'
import { http } from 'msw'

export function partsControllerGetPartHandler(
  data?: PartsControllerGetPartQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/parts/:urn', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
