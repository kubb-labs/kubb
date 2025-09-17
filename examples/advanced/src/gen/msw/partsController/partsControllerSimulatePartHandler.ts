import type { PartsControllerSimulatePartMutationResponse } from '../../models/ts/partsController/PartsControllerSimulatePart.ts'
import { http } from 'msw'

export function partsControllerSimulatePartHandler(
  data?: PartsControllerSimulatePartMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response),
) {
  return http.post('/api/parts/:urn/simulate', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
