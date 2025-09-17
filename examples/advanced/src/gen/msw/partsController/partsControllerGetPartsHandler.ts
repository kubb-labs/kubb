import type { PartsControllerGetPartsQueryResponse } from '../../models/ts/partsController/PartsControllerGetParts.ts'
import { http } from 'msw'

export function partsControllerGetPartsHandler(
  data?: PartsControllerGetPartsQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/parts', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
