import type { TenantsControllerCreateTenantMutationResponse } from '../../models/ts/tenantsController/TenantsControllerCreateTenant.ts'
import { http } from 'msw'

export function tenantsControllerCreateTenantHandler(
  data?: TenantsControllerCreateTenantMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/tenants', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
