import type { WeldPacksControllerGetWeldPacksQueryResponse } from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPacks.ts'
import { http } from 'msw'

export function weldPacksControllerGetWeldPacksHandler(
  data?: WeldPacksControllerGetWeldPacksQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/weldpacks', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
