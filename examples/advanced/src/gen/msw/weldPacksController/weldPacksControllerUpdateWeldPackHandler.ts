import type { WeldPacksControllerUpdateWeldPackMutationResponse } from '../../models/ts/weldPacksController/WeldPacksControllerUpdateWeldPack.ts'
import { http } from 'msw'

export function weldPacksControllerUpdateWeldPackHandler(
  data?: WeldPacksControllerUpdateWeldPackMutationResponse | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Response),
) {
  return http.patch('/api/weldpacks/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
