import type { TenantsControllerGetActiveLicenseQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetActiveLicense.ts'
import { http } from 'msw'

export function tenantsControllerGetActiveLicenseHandler(
  data?: TenantsControllerGetActiveLicenseQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/tenants/:id/active-license', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
