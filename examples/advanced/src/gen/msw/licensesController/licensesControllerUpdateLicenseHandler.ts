import type { LicensesControllerUpdateLicenseMutationResponse } from '../../models/ts/licensesController/LicensesControllerUpdateLicense.ts'
import { http } from 'msw'

export function licensesControllerUpdateLicenseHandler(
  data?: LicensesControllerUpdateLicenseMutationResponse | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Response),
) {
  return http.patch('/api/licenses/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
