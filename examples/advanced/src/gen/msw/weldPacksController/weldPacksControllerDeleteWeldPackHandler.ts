import type { WeldPacksControllerDeleteWeldPackMutationResponse } from '../../models/ts/weldPacksController/WeldPacksControllerDeleteWeldPack.ts'
import { http } from 'msw'

export function weldPacksControllerDeleteWeldPackHandler(
  data?: WeldPacksControllerDeleteWeldPackMutationResponse | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response),
) {
  return http.delete('/api/weldpacks/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
