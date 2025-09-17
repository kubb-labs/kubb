import type { LicensesControllerDeleteLicenseMutationResponse } from '../../models/ts/licensesController/LicensesControllerDeleteLicense.ts'
import { http } from 'msw'

export function licensesControllerDeleteLicenseHandler(
  data?: LicensesControllerDeleteLicenseMutationResponse | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response),
) {
  return http.delete('/api/licenses/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
