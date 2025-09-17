import type { LicensesControllerActivateLicenseMutationResponse } from '../../models/ts/licensesController/LicensesControllerActivateLicense.ts'
import { http } from 'msw'

export function licensesControllerActivateLicenseHandler(
  data?: LicensesControllerActivateLicenseMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/licenses/:id/activate', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
