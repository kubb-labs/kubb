import type { WeldPacksControllerDeactivateLicenseMutationResponse } from '../../models/ts/weldPacksController/WeldPacksControllerDeactivateLicense.ts'
import { http } from 'msw'

export function weldPacksControllerDeactivateLicenseHandler(
  data?: WeldPacksControllerDeactivateLicenseMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/weldpacks/:id/deactivate', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
