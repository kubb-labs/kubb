import type { WeldPacksControllerCreateWeldPackMutationResponse } from '../../models/ts/weldPacksController/WeldPacksControllerCreateWeldPack.ts'
import { http } from 'msw'

export function weldPacksControllerCreateWeldPackHandler(
  data?: WeldPacksControllerCreateWeldPackMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/weldpacks', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
