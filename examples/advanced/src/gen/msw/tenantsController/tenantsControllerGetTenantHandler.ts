import type { TenantsControllerGetTenantQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetTenant.ts'
import { http } from 'msw'

export function tenantsControllerGetTenantHandler(
  data?: TenantsControllerGetTenantQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/tenants/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
