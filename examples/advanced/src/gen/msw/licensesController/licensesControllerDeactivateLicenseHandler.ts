import type { LicensesControllerDeactivateLicenseMutationResponse } from '../../models/ts/licensesController/LicensesControllerDeactivateLicense.ts'
import { http } from 'msw'

export function licensesControllerDeactivateLicenseHandler(
  data?: LicensesControllerDeactivateLicenseMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/licenses/:id/deactivate', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
