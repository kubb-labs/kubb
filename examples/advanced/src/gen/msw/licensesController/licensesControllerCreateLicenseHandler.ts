import type { LicensesControllerCreateLicenseMutationResponse } from '../../models/ts/licensesController/LicensesControllerCreateLicense.ts'
import { http } from 'msw'

export function licensesControllerCreateLicenseHandler(
  data?: LicensesControllerCreateLicenseMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/licenses', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
