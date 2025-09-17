import type { TenantsControllerGetActiveWeldPackQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetActiveWeldPack.ts'
import { http } from 'msw'

export function tenantsControllerGetActiveWeldPackHandler(
  data?: TenantsControllerGetActiveWeldPackQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/tenants/:id/active-weldpack', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
