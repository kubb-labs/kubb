import type { LicensesControllerGetLicenseQueryResponse } from '../../models/ts/licensesController/LicensesControllerGetLicense.ts'
import { http } from 'msw'

export function licensesControllerGetLicenseHandler(
  data?: LicensesControllerGetLicenseQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/licenses/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
