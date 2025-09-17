import type { TenantsControllerUpdateTenantMutationResponse } from '../../models/ts/tenantsController/TenantsControllerUpdateTenant.ts'
import { http } from 'msw'

export function tenantsControllerUpdateTenantHandler(
  data?: TenantsControllerUpdateTenantMutationResponse | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Response),
) {
  return http.patch('/api/tenants/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
