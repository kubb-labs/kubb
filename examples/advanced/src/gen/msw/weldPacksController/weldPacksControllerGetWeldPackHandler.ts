import type { WeldPacksControllerGetWeldPackQueryResponse } from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPack.ts'
import { http } from 'msw'

export function weldPacksControllerGetWeldPackHandler(
  data?: WeldPacksControllerGetWeldPackQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/weldpacks/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
