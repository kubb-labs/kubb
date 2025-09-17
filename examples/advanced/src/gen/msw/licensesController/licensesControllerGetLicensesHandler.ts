import type { LicensesControllerGetLicensesQueryResponse } from '../../models/ts/licensesController/LicensesControllerGetLicenses.ts'
import { http } from 'msw'

export function licensesControllerGetLicensesHandler(
  data?: LicensesControllerGetLicensesQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/licenses', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
