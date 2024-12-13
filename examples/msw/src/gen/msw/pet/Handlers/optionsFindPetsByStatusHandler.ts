import type { OptionsFindPetsByStatusMutationResponse } from '../../../models/OptionsFindPetsByStatus.ts'
import { http } from 'msw'

export function optionsFindPetsByStatusHandler(
  data?: OptionsFindPetsByStatusMutationResponse | ((info: Parameters<Parameters<typeof http.options>[1]>[0]) => Response),
) {
  return http.options('*/pet/findByStatus', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
