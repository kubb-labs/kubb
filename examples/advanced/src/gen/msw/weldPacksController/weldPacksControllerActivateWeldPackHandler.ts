import type { WeldPacksControllerActivateWeldPackMutationResponse } from '../../models/ts/weldPacksController/WeldPacksControllerActivateWeldPack.ts'
import { http } from 'msw'

export function weldPacksControllerActivateWeldPackHandler(
  data?: WeldPacksControllerActivateWeldPackMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/weldpacks/:id/activate', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
