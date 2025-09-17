import type { TenantsControllerGetTenantsQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetTenants.ts'
import { http } from 'msw'

export function tenantsControllerGetTenantsHandler(
  data?: TenantsControllerGetTenantsQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/tenants', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
