import type { TenantsControllerGetWeldCreditsQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetWeldCredits.ts'
import { http } from 'msw'

export function tenantsControllerGetWeldCreditsHandler(
  data?: TenantsControllerGetWeldCreditsQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/tenants/:id/weld-credits', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
